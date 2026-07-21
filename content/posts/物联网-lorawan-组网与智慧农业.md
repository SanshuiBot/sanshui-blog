---
title: 物联网 LoRaWAN 组网与智慧农业：从传感器到云端
date: 2026-07-21
tags: [物联网, LoRaWAN, 智慧农业]
excerpt: 一篇文章打通 LoRaWAN 物联网全栈：节点硬件、网关、NS/AS 服务器、应用层，最后落地智慧农业实战案例。
---

# 物联网 LoRaWAN 组网与智慧农业：从传感器到云端

物联网正在重塑各行各业。从工厂车间到农场田埂，从城市下水道到森林防火——传感器节点的数量已经超过全球人口。而 LoRaWAN，凭借其"低功耗、远距离、广覆盖"的特性，成为低功耗广域网（LPWAN）领域最被广泛采用的协议之一。

这篇文章会带你彻底理解 LoRaWAN 的技术架构，并落地一个真实的智慧农业系统。

## 一、为什么是 LoRaWAN？

### 1.1 LPWAN 的位置

```
┌─────────────────────────────────────────────┐
│  高带宽低延迟：5G / Wi-Fi 6                 │
├─────────────────────────────────────────────┤
│  中速中距：BLE / Zigbee / Thread            │
├─────────────────────────────────────────────┤
│  LPWAN 低速远距：LoRaWAN / NB-IoT / Sigfox │
└─────────────────────────────────────────────┘
```

LoRaWAN 适合：
- 每天传几个字节的小数据包
- 电池要撑 5-10 年
- 单基站覆盖数公里（城市 2-5km，郊区 15km）

不适合：视频流、实时控制、高 QoS 通信。

### 1.2 LoRa vs LoRaWAN

- **LoRa**：物理层调制技术（CSS - Chirp Spread Spectrum），由 Semtech SX127x 芯片实现
- **LoRaWAN**：在 LoRa 物理层之上构建的 MAC 层和网络层协议

类比：LoRa 是"线缆"，LoRaWAN 是"TCP/IP 协议栈"。

## 二、LoRaWAN 网络架构

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  End      │      │  End      │      │  End      │
│  Device   │      │  Device   │      │  Device   │
└─────┬────┘      └─────┬────┘      └─────┬────┘
      │ LoRa RF         │                  │
      ▼                 ▼                  ▼
┌──────────────────────────────────────────────────┐
│  Gateway（网关，硬件）                            │
│  └─ 收到的 LoRa 包封装成 UDP/IP，发给 NS         │
└──────────────────────┬───────────────────────────┘
                       │ IP 网络
                       ▼
┌──────────────────────────────────────────────────┐
│  Network Server（NS）：去重、MAC 层处理、网关调度 │
│  Application Server（AS）：解密 payload、应用路由 │
│  Join Server（JS）：处理 OTAA 入网、密钥派生      │
└──────────────────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Application    │
              │  (云端业务)     │
              └────────────────┘
```

### 2.1 端设备的 Class

| Class | 含义 | 适用 |
|-------|------|------|
| Class A | 上行后开两个下行窗口 | 默认，最省电 |
| Class B | 周期性下行（Beacon 同步） | 需要主动下行的场景 |
| Class C | 持续监听下行 | 有常供电的场景 |

### 2.2 OTAA 入网流程

```
1. End Device ──Join Request──► Gateway ──► NS ──► JS
2. JS 校验 DevEUI / AppEUI / AppKey
3. JS 派生 AppSKey + NwkSKey
4. JS ──► NS ──► Gateway ──Join Accept──► End Device
5. End Device 用 AppKey 解密 Join Accept，得到会话密钥
6. 后续通信用会话密钥加密
```

**OTAA vs ABP**：

- **OTAA**（Over The Air Activation）：设备出厂只烧 DevEUI/AppKey，入网时协商密钥
- **ABP**（Activation By Personalization）：设备出厂烧死 DevAddr/AppSKey/NwkSKey

OTAA 更安全、更灵活，是生产首选。

## 三、硬件：节点与网关

### 3.1 节点（End Device）

典型 BOM：
- MCU：STM32L0 系列（低功耗）
- LoRa 芯片：Semtech SX1262（性能比 SX1276 好）
- 传感器：SHT3x（温湿度）、TSL2591（光照）、 capacitance soil moisture
- 电源：单节 18650 锂电池 + 太阳能板

### 3.2 Arduino + SX1276 节点代码

```cpp
#include <LoRa.h>

void setup() {
  Serial.begin(9600);
  while (!Serial);
  
  if (!LoRa.begin(915E6)) {  // 北美 915MHz，中国 470MHz
    Serial.println("LoRa init failed");
    while (1);
  }
  
  LoRa.setSpreadingFactor(12);   // SF12：最远距离，最低速率
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(5);
  LoRa.setSyncWord(0x34);       // 私有同步字（默认 0x12 是公共 LoRaWAN）
}

void loop() {
  // 从传感器读数
  float temp = readTemperature();
  float humidity = readHumidity();
  
  // 打包 payload
  String payload = String(temp) + "," + String(humidity);
  
  // 发送
  LoRa.beginPacket();
  LoRa.print(payload);
  LoRa.endPacket();
  
  // Deep Sleep（用 RTC 唤醒，省电）
  lowPowerSleep(600);  // 10 分钟
}
```

### 3.3 网关（Gateway）

网关不是普通 LoRa 节点，它是**多通道收发器**，能同时监听 8-16 个频率 + SF 组合。

主流网关芯片：
- **SX1301**：第一代，10 通道
- **SX1302 / SX1308**：第二代，功耗低，性能强

商用网关推荐：
- **MikroTik KNOT LR8**：性价比高，户外防水
- **RAK Wireless RAK7289**：开发者友好，文档完善
- **Kerlink Wirnet Station**：电信级

### 3.4 网关软件包：Packet Forwarder

网关把 LoRa 数据包封装成 UDP，发给 NS。Semtech 原版 Packet Forwarder 已被 `basicstation` 替代——后者支持 LNS（LoRaWAN Network Server）协议，更稳定。

```
┌─────────────────────────────────────────────┐
│  Gateway（SX1302 + Raspberry Pi CM4）        │
│  └─ basicstation ──LNS──► NS（UDP 1700）     │
└─────────────────────────────────────────────┘
```

## 四、ChirpStack：开源 NS/AS 服务器

### 4.1 架构

```
┌──────────────────────────────────────────┐
│  Application（Node-RED / 自建后端）       │
├──────────────────────────────────────────┤
│  ChirpStack AS（REST/MQTT 暴露数据）      │
├──────────────────────────────────────────┤
│  ChirpStack NS（处理 LoRaWAN 协议）       │
├──────────────────────────────────────────┤
│  PostgreSQL + Redis（配置 + 实时状态）    │
├──────────────────────────────────────────┤
│  MQTT Broker（mosquitto）                 │
└──────────────────────────────────────────┘
```

### 4.2 Docker Compose 部署

```yaml
version: '3.8'
services:
  chirpstack:
    image: chirpstack/chirpstack:4
    ports: ["8080:8080"]
    environment:
      MQTT_BROKER_HOST: mosquitto
      POSTGRES_DSN: postgres://chirpstack:cs@db/chirpstack?sslmode=disable
      REDIS_URL: redis://redis
    depends_on: [db, redis, mosquitto]
  
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: chirpstack
      POSTGRES_USER: chirpstack
      POSTGRES_PASSWORD: cs
  
  redis:
    image: redis:7-alpine
  
  mosquitto:
    image: eclipse-mosquitto:2
    ports: ["1883:1883"]
```

启动后访问 `http://localhost:8080`，配置 Service Profile、Device Profile，就可以开始添加设备了。

### 4.3 通过 MQTT 接收上行数据

ChirpStack 默认把上行帧发到 `application/<app_id>/device/<dev_eui>/event/up`：

```python
import paho.mqtt.client as mqtt
import json

def on_connect(client, userdata, flags, rc):
    client.subscribe("application/+/device/+/event/+")

def on_message(client, userdata, msg):
    payload = json.loads(msg.payload)
    # 解析 data 字段（base64 编码的 LoRa payload）
    raw = base64.b64decode(payload['data'])
    temp = int.from_bytes(raw[0:2], 'little', signed=True) / 10
    humidity = raw[2]
    print(f"Temperature: {temp}°C, Humidity: {humidity}%")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect("localhost", 1883, 60)
client.loop_forever()
```

## 五、Payload 编解码

LoRa 带宽宝贵，必须用最紧凑的二进制格式。ChirpStack 通过 JavaScript 编解码器把原始字节翻译成结构化数据。

### 5.1 上行解码器

```javascript
// decodeUplink.js
function decodeUplend(input) {
  var bytes = input.bytes;
  
  switch (input.fPort) {
    case 1:  // 气象数据
      return {
        data: {
          temperature: (bytes[0] << 8 | bytes[1]) / 10,
          humidity: bytes[2],
          pressure: (bytes[3] << 16 | bytes[4] << 8 | bytes[5]) / 100,
          battery: bytes[6] / 10,
        },
      };
    case 2:  // 土壤数据
      return {
        data: {
          soilMoisture: bytes[0],
          soilTemperature: (bytes[1] << 8 | bytes[2]) / 10,
        },
      };
    default:
      return { errors: ['Unknown fPort'] };
  }
}
```

### 5.2 下行编码器

```javascript
function encodeDownlink(input) {
  var bytes = [];
  
  if (input.data.command === 'setInterval') {
    bytes[0] = 0x01;
    bytes[1] = (input.data.interval >> 8) & 0xFF;
    bytes[2] = input.data.interval & 0xFF;
  }
  
  return {
    bytes: bytes,
    fPort: 1,
  };
}
```

## 六、低功耗设计

LoRaWAN 设备目标是 5-10 年电池寿命，每个微安都要省。

### 6.1 占空比与发送间隔

LoRa 物理层占用频段有 Duty Cycle 限制（欧洲 1%，中国 SUB-G 默认 1%）。

**计算公式**：

```
DutyCycle = TimeOnAir × (1 / Interval) ≤ 0.01
```

TimeOnAir 与 SF、BW、payload 长度有关。SF12、125kHz、20B 的 TimeOnAir 约 1.5s。所以最短发送间隔 = 1.5 × 100 = 150s。

### 6.2 MCU 低功耗模式

```c
// STM32 伪代码
void loop() {
  readSensors();
  transmitLora();
  
  // 关闭外设电源（传感器）
  HAL_GPIO_WritePin(SENSOR_PWR_GPIO_Port, SENSOR_PWR_Pin, GPIO_PIN_RESET);
  
  // 关闭 LoRa 模块（除晶振）
  SX126x_SetSleep();
  
  // 进入 STOP2 模式（功耗 ~3μA，RAM 保留）
  HAL_PWREx_EnterSTOP2Mode(PWR_LOWPOWERREGULATOR_ON, PWR_STOPENTRY_WFI);
  
  // RTC Wakeup 触发重启
  // ...继续循环
}
```

### 6.3 真实功耗参考

- **MCU Sleep**：3-5μA
- **MCU Active**：8mA @ 16MHz
- **SX126x Sleep**：1-2μA
- **SX126x TX（17dBm）**：110mA（持续约 1.5s）

**电池寿命估算**：

```
Total = 1000mAh × 1000 = 1,000,000μAh
Daily = (Active Time × Active Current) + (Sleep Time × Sleep Current)
```

若每天发送 24 次、每次 1.5s TX + 100ms RX，Sleep 占其余时间，则寿命可达 5+ 年。

## 七、网关部署：选址与覆盖

### 7.1 链路预算

```
链路预算 = TX 功率 + 接收灵敏度 + 天线增益 − 馈线损耗 − 衰落余量
```

举例：

- TX 功率：14 dBm
- 接收灵敏度：−137 dBm（SF12）
- 天线增益：3 dBi
- 衰落余量：10 dB
- 最大路径损耗：14 − (−137) + 3 − 10 = 144 dB

### 7.2 实测覆盖范围

| 环境 | 距离 |
|------|------|
| 城市密集 | 1-2 km |
| 城市一般 | 2-5 km |
| 郊区 | 5-10 km |
| 开阔地 | 10-15 km |

**覆盖盲区解决**：

- 多网关重叠部署（NS 自动合并）
- 用定向天线（如 8dBi 八木）覆盖特定区域
- 增加节点天线高度（每升高 6m，覆盖增加 1.5 倍）

## 八、智慧农业实战

### 8.1 系统架构

```
┌──────────────────────────────────────────┐
│  Web Dashboard（Vue/React 前端）         │
├──────────────────────────────────────────┤
│  Backend API（Python FastAPI + TimescaleDB）│
│  └─ 报警、灌溉自动控制、数据可视化       │
├──────────────────────────────────────────┤
│  ChirpStack + MQTT                       │
├──────────────────────────────────────────┤
│  Gateways（覆盖田区）                    │
├──────────────────────────────────────────┤
│  End Devices（土壤、气象、虫情监测）    │
└──────────────────────────────────────────┘
```

### 8.2 节点设计

每个田块部署以下节点：

1. **土壤节点**：5 层土壤水分 + 温度，深 10/20/40/60/80cm
2. **气象节点**：温度、湿度、风速、风向、降雨、光照
3. **虫情节点**：基于图像识别 + 远红外诱虫灯

### 8.3 灌溉自动控制

LoRaWAN 下行（Class C）控制电磁阀：

```python
# Python 后端
def trigger_irrigation(zone_id: int, duration_min: int):
    """触发指定区域灌溉"""
    dev_eui = ZONE_DEVICE_MAP[zone_id]
    cmd = {
        "command": "openValve",
        "duration": duration_min,
    }
    # 通过 ChirpStack API 下发 downlink
    requests.post(
        f"{CHIRPSTACK_URL}/api/devices/{dev_eui}/queue",
        json={"deviceQueueItem": {
            "confirmed": True,
            "fPort": 2,
            "data": base64.b64encode(encode_cmd(cmd)).decode(),
        }}
    )

# 基于土壤湿度的自动灌溉
def auto_irrigation_loop():
    while True:
        moisture = get_latest_soil_moisture(zone_id=1, depth_cm=20)
        if moisture < 30:  # 阈值 30%
            trigger_irrigation(zone_id=1, duration_min=15)
            send_alert("Zone 1 灌溉已触发")
        time.sleep(3600)
```

### 8.4 数据可视化

**TimescaleDB + Grafana** 是物联网数据可视化的黄金组合：

```sql
CREATE TABLE sensor_readings (
    device_eui   TEXT NOT NULL,
    reading_time TIMESTAMPTZ NOT NULL,
    temperature  REAL,
    humidity     REAL,
    soil_moist   REAL,
    PRIMARY KEY (device_eui, reading_time)
);

SELECT create_hypertable('sensor_readings', 'reading_time');
```

```sql
-- 每小时聚合
SELECT
    time_bucket('1 hour', reading_time) AS bucket,
    avg(temperature) AS avg_temp,
    max(soil_moist) AS max_soil,
    min(soil_moist) AS min_soil
FROM sensor_readings
WHERE reading_time > NOW() - INTERVAL '7 days'
GROUP BY bucket;
```

Grafana 配置 TimescaleDB 数据源，建一个"农场总览"看板，可以叠加灌溉事件、温湿度曲线、降雨量。

## 九、安全：LoRaWAN 的密码学

### 9.1 双密钥设计

- **NwkSKey**：网络层完整性校验（MIC），由 NS 使用
- **AppSKey**：应用层 payload 加密，由 AS 使用

任何中间环节（网关、NS）都无法解密应用 payload。

### 9.2 32 位 Frame Counter

每次上行/下行帧计数器加一，防止重放攻击。NS 检查计数器必须单调递增。

**注意事项**：

- 设备复位会重置计数器，导致 NS 拒收
- 解决方案：在 ChirpStack 上手动 Reset Frame Counters

### 9.3 Join Request 安全

Join Request 包含 DevNonce（随机数），用 AppKey 加密。如果同一 DevNonce 出现两次，NS 会拒绝入网，防止重放 Join。

## 十、运营与维护

### 10.1 设备 OTA 升级

LoRaWAN 支持 FUOTA（Firmware Update Over The Air）：

- **Multicast**：把多个设备编入多播组，同步下发固件块
- **Fragmented Data Block Transport**：把固件分块传输，设备拼接后写入 Flash

通常一轮 FUOTA 需要几天，因为受 Duty Cycle 限制。

### 10.2 网关监控

每个网关需要监控：

- CPU 温度、负载
- LoRa 模块温度（超过 75°C 会自动停机）
- 回传链路延迟（网关到 NS）
- 上行报文率（异常下降表示天线问题）

### 10.3 数据治理

**存储分层**：

- 热数据（最近 7 天）：Redis / 内存缓存
- 温数据（最近 1 年）：TimescaleDB
- 冷数据（1 年以上）：S3 Parquet，可用 Athena / DuckDB 查询

**数据归一化**：

不同厂家传感器的值范围、校准系数都不同。建议在 AS 上做一层"传感器校准中间件"，把原始值转换成 SI 单位后再发到下游。

## 十一、未来：LoRa Edge 与 AIoT

Semtech 推出的 **LoRa Edge** 系列（如 LR1110）集成了：

- LoRa 收发器
- Wi-Fi / GNSS 扫描（用于无 GPS 定位）
- 低功耗 BLE

这使得"室内定位 + 资产追踪"成为可能。配合边缘 AI（如 TinyML），LoRaWAN 节点不再是哑传感器，而是具备本地推断能力的智能终端。

## 结语

LoRaWAN 看起来简单，但要做好一个覆盖数千节点、可靠运行多年的网络，需要的工程能力一点也不少：

- 硬件：射频电路设计、低功耗优化
- 嵌入式：RTC + Sleep、Flash OTA
- 网络：网关部署、信道规划
- 后端：MQTT、时序数据库、告警
- 业务：每个垂直领域都有不同的协议和数据模型

智慧农业是 LoRaWAN 最典型的应用场景之一。一块块田地的传感器数据，汇成粮食安全的数字底座——这就是物联网工程师的工作价值所在。

> 下一篇预告：《现代密码学与零知识证明实践：从椭圆曲线到 zk-SNARK》
