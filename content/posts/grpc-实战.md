---
title: gRPC 实战：从 Protobuf 到双向流
date: 2026-07-27
tags: [gRPC, 后端, 微服务, 技术, 踩坑]
excerpt: 微服务间通信从 HTTP/JSON 换到 gRPC，吞吐量提升 5 倍。本文讲 Protobuf 编码、 unary vs stream、keepalive 心跳、拦截器链、metadata 透传，再到 6 个生产踩坑。
---

# gRPC 实战：从 Protobuf 到双向流

公司一个微服务集群，服务间用 HTTP/JSON 通信。监控发现：80% 的 CPU 时间花在 JSON 序列化/反序列化上。换成 gRPC 后，吞吐量提升 5 倍，延迟降到原来的 1/3。这篇文章记录完整落地过程。

## 一、gRPC 相比 HTTP/JSON 的核心优势

| 维度     | HTTP/JSON   | gRPC            |
| -------- | ----------- | --------------- |
| 编码     | 文本 JSON   | 二进制 Protobuf |
| 多路复用 | HTTP/1.1 无 | HTTP/2 有       |
| 流式     | 不支持      | 原生支持        |
| 接口契约 | 文档        | .proto 文件     |
| 性能     | 慢          | 5-10 倍快       |

**Protobuf 编码示例**：

```protobuf
message User {
  int64 id = 1;
  string name = 2;
  repeated string tags = 3;
}
```

JSON 编码（约 80 字节）：

```json
{ "id": 1234567890, "name": "San Shui", "tags": ["dev", "blog"] }
```

Protobuf 编码（约 35 字节）：

```
08 d2 85 d8 cc 04 12 0a 53 61 6e 20 53 68 75 69
1a 03 64 65 76 1a 04 62 6c 6f 67
```

数字用 varint 编码，字符串用 length-prefixed，比 JSON 紧凑得多。

## 二、定义 Protobuf 接口

```protobuf
// user.proto
syntax = "proto3";

package user.v1;
option go_package = "github.com/myorg/api/user/v1;userv1";

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (stream User);
  rpc WatchUsers(WatchUsersRequest) returns (stream User);
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message GetUserRequest { int64 id = 1; }
message GetUserResponse { User user = 1; }
message User { int64 id = 1; string name = 2; }
```

四种 RPC 模式：

1. **Unary**：`rpc A(Request) returns (Response)` —— 一问一答
2. **Server Stream**：`returns (stream Response)` —— 服务端流
3. **Client Stream**：`(stream Request) returns` —— 客户端流
4. **Bidirectional**：`(stream Request) returns (stream Response)` —— 双向流

## 三、生成 Go 代码

```bash
# 安装 buf
brew install bufbuild/buf/buf

# 生成代码
buf generate
```

```yaml
# buf.gen.yaml
version: v1
plugins:
  - plugin: buf.build/protocolbuffers/go
    out: gen/go
    opt: paths=source_relative
  - plugin: buf.build/grpc/go
    out: gen/go
    opt: paths=source_relative
```

## 四、服务端实现

```go
type userServer struct {
    userv1.UnimplementedUserServiceServer
    db *sql.DB
}

func (s *userServer) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
    user, err := s.db.GetUser(ctx, req.Id)
    if err != nil {
        return nil, status.Error(codes.Internal, err.Error())
    }
    return &userv1.GetUserResponse{User: user}, nil
}

func (s *userServer) ListUsers(req *userv1.ListUsersRequest, stream userv1.UserService_ListUsersServer) error {
    users, err := s.db.ListUsers(stream.Context(), req)
    if err != nil {
        return status.Error(codes.Internal, err.Error())
    }
    for _, u := range users {
        if err := stream.Send(u); err != nil {
            return err
        }
    }
    return nil
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    server := grpc.NewServer(
        grpc.UnaryInterceptor(grpc_prometheus.UnaryServerInterceptor),
    )
    userv1.RegisterUserServiceServer(server, &userServer{})
    server.Serve(lis)
}
```

## 五、客户端实现

```go
func main() {
    conn, _ := grpc.Dial("localhost:50051",
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
    )
    client := userv1.NewUserServiceClient(conn)

    // Unary
    resp, err := client.GetUser(ctx, &userv1.GetUserRequest{Id: 1})

    // Server Stream
    stream, _ := client.ListUsers(ctx, &userv1.ListUsersRequest{Limit: 100})
    for {
        user, err := stream.Recv()
        if err == io.EOF { break }
        if err != nil { log.Fatal(err) }
        fmt.Println(user)
    }
}
```

## 六、踩坑 1：keepalive 心跳不工作

默认 gRPC 不发心跳。如果服务端有 firewall 断开空闲连接，客户端会卡住。

**修复**：

```go
// 服务端
server := grpc.NewServer(
    grpc.KeepaliveParams(keepalive.ServerParameters{
        Time:    30 * time.Second,
        Timeout: 10 * time.Second,
    }),
    grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{
        MinTime:             10 * time.Second,
        PermitWithoutStream: true,
    }),
)

// 客户端
conn, _ := grpc.Dial(addr,
    grpc.WithKeepaliveParams(keepalive.ClientParameters{
        Time:                30 * time.Second,
        Timeout:             10 * time.Second,
        PermitWithoutStream: true,
    }),
)
```

**关键**：`PermitWithoutStream: true` 允许在没有活跃 RPC 时也发心跳，这是 firewall 友好的关键。

## 七、踩坑 2：metadata 透传失败

```go
// 客户端发 metadata
md := metadata.New(map[string]string{
    "x-user-id":    "123",
    "x-request-id": uuid.NewString(),
})
ctx = metadata.NewOutgoingContext(ctx, md)

// 服务端收 metadata
md, _ = metadata.FromIncomingContext(ctx)
userID := md.Get("x-user-id")  // []
```

**修复**：gRPC metadata key 必须小写。

```go
md := metadata.New(map[string]string{
    "x-user-id":    "123",
    "x-request-id": uuid.NewString(),
})
```

## 八、踩坑 3：错误码丢失

```go
// 服务端返回错误
return nil, status.Error(codes.NotFound, "user not found")

// 客户端处理
resp, err := client.GetUser(ctx, req)
if err != nil {
    if status.Code(err) == codes.NotFound {
        // 处理 404
    }
}
```

**坑点**：业务错误信息放在 `status.Error` 的 message 里。如果想传结构化错误信息，用 `status.WithDetails`：

```go
st := status.New(codes.InvalidArgument, "validation failed")
st, _ = st.WithDetails(&userv1.ValidationError{
    Field:   "email",
    Message: "invalid format",
})
return nil, st.Err()
```

## 九、拦截器链：日志、认证、限流

```go
func loggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    log.Printf("%s took %v err=%v", info.FullMethod, time.Since(start), err)
    return resp, err
}

func authInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    md, _ := metadata.FromIncomingContext(ctx)
    token := md.Get("authorization")
    if len(token) == 0 {
        return nil, status.Error(codes.Unauthenticated, "no token")
    }
    if err := validateToken(token[0]); err != nil {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }
    return handler(ctx, req)
}

// 链式拦截器
server := grpc.NewServer(
    grpc.ChainUnaryInterceptor(
        loggingInterceptor,
        authInterceptor,
        ratelimitInterceptor,
    ),
)
```

**执行顺序**：

1. loggingInterceptor 入口
2. authInterceptor 入口
3. ratelimitInterceptor 入口
4. handler 执行
5. ratelimitInterceptor 出口
6. authInterceptor 出口
7. loggingInterceptor 出口

## 十、踩坑 4：客户端连接复用

```go
// ❌ 每次 RPC 都新建 conn
func GetUser(id int64) {
    conn, _ := grpc.Dial(addr, ...)
    defer conn.Close()
    client.GetUser(ctx, req)
}

// ✅ 全局复用 conn
var globalConn *grpc.ClientConn

func Init() {
    globalConn, _ = grpc.Dial(addr, ...)
}

func GetUser(id int64) {
    client := userv1.NewUserServiceClient(globalConn)
    return client.GetUser(ctx, req)
}
```

**grpc.ClientConn 是线程安全的**，所有 goroutine 共享一个连接，HTTP/2 多路复用自动处理并发。

## 十一、双向流实战：实时聊天

```protobuf
service ChatService {
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message ChatMessage {
  string user = 1;
  string text = 2;
  int64 timestamp = 3;
}
```

```go
type chatServer struct {
    userv1.UnimplementedChatServiceServer
    mu      sync.Mutex
    streams []userv1.ChatService_ChatServer
}

func (s *chatServer) Chat(stream userv1.ChatService_ChatServer) error {
    // 注册新客户端
    s.mu.Lock()
    s.streams = append(s.streams, stream)
    s.mu.Unlock()

    // 接收消息并广播
    for {
        msg, err := stream.Recv()
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }
        s.broadcast(msg)
    }
}

func (s *chatServer) broadcast(msg *userv1.ChatMessage) {
    s.mu.Lock()
    defer s.mu.Unlock()
    for _, stream := range s.streams {
        if err := stream.Send(msg); err != nil {
            // 移除断开的 stream
        }
    }
}
```

## 十二、客户端负载均衡

### DNS 服务发现

```go
conn, _ := grpc.Dial("dns:///user-service:50051",
    grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
)
```

gRPC 客户端会定期解析 DNS，把所有 A 记录当作后端。

### xDS 服务发现（生产推荐）

```go
import _ "google.golang.org/grpc/xds" // 注册 xDS balancer

conn, _ := grpc.Dial("xds:///user-service")
```

xDS 是 Envoy / Istio 用的服务发现协议，支持：

- 周期性端点更新
- 健康检查
- 加权负载均衡
- 故障转移

## 十三、踩坑 5：超过 max message size

```go
// 默认限制 4MB
// 大消息场景
conn, _ := grpc.Dial(addr,
    grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(64*1024*1024)),
)

// 服务端
server := grpc.NewServer(
    grpc.MaxRecvMsgSize(64*1024*1024),
    grpc.MaxSendMsgSize(64*1024*1024),
)
```

**坑点**：超过限制的报错信息是 `received message larger than max`，不太直观。生产环境推荐明确设置。

## 十四、踩坑 6：context deadline exceeded

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

resp, err := client.GetUser(ctx, req)
// err: context deadline exceeded
```

**修复**：

1. 调大 deadline
2. 服务端优化处理速度
3. 用 stream 替代 unary，分批返回

**关键**：**永远不要用无限期 context**。生产环境推荐 5-10s deadline。

## 十五、性能对比：HTTP/JSON vs gRPC

| 指标         | HTTP/JSON | gRPC       |
| ------------ | --------- | ---------- |
| 1000 QPS CPU | 80%       | 25%        |
| P99 延迟     | 45ms      | 12ms       |
| 网络流量     | 100%      | 30%        |
| 连接数       | 多        | 单连接复用 |

**5 倍吞吐量提升**是真实数据。

## 十六、总结

gRPC 落地的 6 条原则：

1. **接口契约先行**：.proto 文件即文档
2. **keepalive 心跳必备**：防火墙友好
3. **metadata key 小写**：gRPC 规范
4. **拦截器链解耦**：日志、认证、限流分离
5. **客户端 conn 复用**：HTTP/2 多路复用
6. **deadline 永远设**：避免雪崩

gRPC 不是「换个协议」那么简单，是「服务间通信」范式的转变。
