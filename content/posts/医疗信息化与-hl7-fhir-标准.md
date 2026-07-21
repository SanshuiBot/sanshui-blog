---
title: 医疗信息化与 HL7 FHIR 标准：从病历到互操作
date: 2026-07-21
tags: [医疗信息化, HL7, FHIR]
excerpt: 一篇文章打通医疗信息化的全栈：HL7 v2/v3 演进、FHIR RESTful API、SMART on FHIR、互操作性挑战与落地实践。
---

# 医疗信息化与 HL7 FHIR 标准：从病历到互操作

医疗行业是信息化难度最高的领域之一。一家三甲医院往往运行着上百个系统——HIS（医院信息系统）、EMR（电子病历）、LIS（实验室信息系统）、PACS（医学影像系统）、RIS（放射信息系统）……这些系统由不同厂商开发，使用不同的数据模型和协议，互操作性极差。

HL7（Health Level 7）组织制定了一系列国际标准来解决这个问题，其中 **FHIR（Fast Healthcare Interoperability Resources）** 是目前最先进、最被广泛采用的标准。这篇文章会带你彻底理解医疗信息化的演进路径和 FHIR 的工程实践。

## 一、医疗信息化的演进

### 1.1 三代标准

| 代 | 标准 | 数据模型 | 协议 |
|----|------|----------|------|
| 1 | HL7 v2 | 段-字段-组件，分隔符 | MLLP / TCP |
| 2 | HL7 v3 + CDA | RIM（Reference Information Model） | XML / SOAP |
| 3 | HL7 FHIR | Resources + REST | HTTP / JSON |

**HL7 v2** 至今仍是医院内部系统集成的事实标准。它"零配置、几乎能容纳任何东西"，但也意味着**实现兼容性差**——同一段 ADT（Admit/Discharge/Transfer）在不同医院可能含义不同。

**HL7 v3** 试图用严格的 RIM 模型解决歧义，但学习曲线陡峭、实现复杂度高，最终只在部分国家强制落地（如加拿大、澳大利亚）。

**FHIR** 是 2014 年起的"重启"——结合 RESTful API、现代 Web 标准和模块化 Resources，目标是在 v2 的灵活性和 v3 的严格性之间找到平衡。

### 1.2 现代医院 IT 架构

```
┌─────────────────────────────────────────────┐
│  临床工作站 / 移动 App                        │
├─────────────────────────────────────────────┤
│  集成平台（HL7 引擎 / ESB）                   │
│  └─ 消息路由、协议转换、术语映射              │
├─────────────────────────────────────────────┤
│  HIS  EMR  LIS  PACS  RIS  药房系统          │
├─────────────────────────────────────────────┤
│  主数据：患者主索引（EMPI）、术语服务（ICD10、LOINC、SNOMED CT） │
└─────────────────────────────────────────────┘
```

**主索引（EMPI）** 是所有系统的"患者单一真相源"。当患者在不同医院就诊时，EMPI 通过身份证、姓名、生日等做概率匹配，确保是同一个人。

## 二、HL7 v2 实战

### 2.1 消息结构

HL7 v2 消息由若干 **Segment** 组成，每个 Segment 由 `|` 分隔的 **Field** 组成，Field 内部可以用 `^` 分隔为 **Component**。

```
MSH|^~\&|HIS|HOSPITAL|LIS|LAB|20260721143000||ADT^A04|MSG00001|P|2.5
EVN|A04|20260721143000
PID|1||PATID1234^^^HOSPITAL^MR||张^三||19800101|M
PV1|1|I|ICU^101^1
```

逐字段解读 MSH：

| 位置 | 含义 | 示例 |
|------|------|------|
| MSH-1 | Field Separator | `|` |
| MSH-2 | Encoding Characters | `^~\&` |
| MSH-3 | Sending Application | `HIS` |
| MSH-4 | Sending Facility | `HOSPITAL` |
| MSH-5 | Receiving Application | `LIS` |
| MSH-6 | Receiving Facility | `LAB` |
| MSH-7 | DateTime | `20260721143000` |
| MSH-9 | Message Type | `ADT^A04`（注册患者） |
| MSH-12 | Version ID | `2.5` |

### 2.2 常见消息类型

- **ADT**（Admit, Discharge, Transfer）：患者就诊状态变化
- **ORM**（Order Message）：医嘱下单
- **ORU**（Observation Result）：检验结果回报
- **MDM**（Medical Document Management）：文档管理

### 2.3 MLLP 协议

HL7 v2 默认通过 TCP 上的 **MLLP（Minimal Lower Layer Protocol）** 传输：

```
<VT> HL7 message <FS><CR>
```

- `<VT>` = 0x0B（消息开始）
- `<FS>` = 0x1C（消息结束）
- `<CR>` = 0x0D

Python 实现：

```python
import socket

def send_hl7(host: str, port: int, message: str) -> str:
    with socket.create_connection((host, port), timeout=10) as sock:
        # MLLP framing
        framed = '\x0b' + message + '\x1c\x0d'
        sock.sendall(framed.encode('utf-8'))
        # 读取响应
        response = b''
        while True:
            chunk = sock.recv(4096)
            response += chunk
            if b'\x1c\x0d' in response:
                break
        return response.decode('utf-8')
```

### 2.4 ACK 应答

```
MSH|^~\&|LIS|LAB|HIS|HOSPITAL|20260721143005||ACK|MSG00001_ACK|P|2.5
MSA|AA|MSG00001
```

- `MSA-1` = `AA`（Application Accept）、`AE`（Application Error）、`AR`（Application Reject）

## 三、FHIR：现代医疗互操作标准

### 3.1 Resource 概念

FHIR 的核心是 **Resource**——一种标准化的数据结构。所有 Resource 共享以下特征：

- URL 可寻址（`/Patient/123`）
- JSON / XML 双向序列化
- 共通的元数据（id、meta、version）
- 严格定义的字段与基数

### 3.2 主要 Resource 类别

| 类别 | 示例 Resource |
|------|--------------|
| 基础 | Patient、Practitioner、Organization、RelatedPerson |
| 临床 | Observation、Condition、MedicationRequest、DiagnosticReport |
| 工作流 | Encounter、Appointment、Task、CarePlan |
| 财务 | Coverage、Claim、ExplanationOfBenefit |
| 术语 | CodeSystem、ValueSet、ConceptMap |

### 3.3 Patient Resource 示例

```json
{
  "resourceType": "Patient",
  "id": "example",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-07-21T14:30:00Z"
  },
  "identifier": [
    {
      "system": "http://hospital.example.com/mrn",
      "value": "PATID1234"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "张",
      "given": ["三"]
    }
  ],
  "gender": "male",
  "birthDate": "1980-01-01",
  "address": [
    {
      "city": "北京",
      "country": "CN"
    }
  ]
}
```

### 3.4 RESTful API

FHIR 把每个 Resource 当成 RESTful 端点：

| 操作 | HTTP | URL |
|------|------|-----|
| 创建 | POST | `/Patient` |
| 读取 | GET | `/Patient/123` |
| 更新 | PUT | `/Patient/123` |
| 删除 | DELETE | `/Patient/123` |
| 搜索 | GET | `/Patient?name=张` |
| 历史版本 | GET | `/Patient/123/_history` |

**搜索能力非常强大**：

```
GET /Observation?patient=123&code=http://loinc.org|2339-0&_sort=-date&_count=20
```

返回患者 123 的所有血压测量（LOINC 2339-0），按日期降序，每页 20 条。

### 3.5 Bundle：返回结果的包装

所有返回多条 Resource 的 API 都用 Bundle 包装：

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 42,
  "link": [
    { "relation": "self", "url": "..." },
    { "relation": "next", "url": "..." }
  ],
  "entry": [
    { "fullUrl": "https://fhir.example.com/Observation/1", "resource": { ... } },
    { "fullUrl": "https://fhir.example.com/Observation/2", "resource": { ... } }
  ]
}
```

## 四、术语服务：让"高血压"不再各说各话

医疗数据的"巴别塔"问题非常严重。同一个"血压"概念在不同标准中编码不同：

- **LOINC**（实验室和临床观察）：`2339-0` 血压
- **SNOMED CT**（临床术语）：`75367002` 血压
- **ICD-10**（疾病诊断）：`I10` 原发性高血压
- **RxNorm**（药物）：`Lisinopril 10 MG Oral Tablet`

FHIR 提供 CodeSystem、ValueSet、ConceptMap 三个 Resource 来管理术语：

```json
{
  "resourceType": "ValueSet",
  "id": "blood-pressure",
  "url": "http://example.com/fhir/ValueSet/blood-pressure",
  "compose": {
    "include": [
      { "system": "http://loinc.org", "concept": [{ "code": "2339-0" }] },
      { "system": "http://snomed.info/sct", "concept": [{ "code": "75367002" }] }
    ]
  }
}
```

通过术语服务，所有系统可以用统一的 LOINC / SNOMED CT 编码交换数据。

## 五、SMART on FHIR：OAuth2 for Healthcare

医疗 App 不能直接连 FHIR 服务器，必须经过授权。**SMART on FHIR** 标准化了这一流程：

```
1. App 向 Authorization Server 发起授权请求
2. 用户在 EHR 弹窗中登录并授权
3. App 拿到 access_token
4. App 用 access_token 调用 FHIR API
```

### 5.1 Launch Scopes

SMART 定义了几种典型 launch 场景：

- `patient/:resourceType`：只能访问当前患者某类资源
- `user/:resourceType`：能访问当前用户权限范围内资源
- `launch/patient`：从 EHR 患者上下文启动 App

```
GET /authorize?
  response_type=code&
  client_id=my-app&
  redirect_uri=https://my-app.com/callback&
  launch=xyz123&
  scope=patient/Observation.read%20patient/Patient.read&
  state=random123
```

### 5.2 后端服务（Backend Services）

医院内部系统集成时不能弹用户登录窗，可以用 **Backend Services** 模式：

1. 系统用私钥签发 JWT
2. 用 JWT 换 access_token
3. 持续调用 FHIR API

```python
import jwt
import requests
import time

def get_backend_token(client_id, private_key, fhir_url):
    jwt_payload = {
        'iss': client_id,
        'sub': client_id,
        'aud': f'{fhir_url}/auth/token',
        'exp': int(time.time()) + 300,
        'jti': str(uuid.uuid4()),
    }
    assertion = jwt.encode(jwt_payload, private_key, algorithm='RS384')
    resp = requests.post(
        f'{fhir_url}/auth/token',
        data={
            'grant_type': 'client_credentials',
            'client_assertion_type': 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            'client_assertion': assertion,
            'scope': 'system/Observation.read',
        }
    )
    return resp.json()['access_token']
```

## 六、FHIR 服务器选型

### 6.1 开源服务器对比

| 服务器 | 语言 | 数据库 | 特点 |
|--------|------|--------|------|
| HAPI FHIR | Java | JPA / ElasticSearch | 最完整，符合性高 |
| Vonk / Firely | .NET | MongoDB / SQL | 商业级，支持好 |
| IBM FHIR Server | Java | PostgreSQL | IBM 支持 |
| Microsoft FHIR | .NET | Cosmos DB / SQL | Azure 集成 |
| fhir-server-go | Go | PostgreSQL | 轻量、性能好 |

### 6.2 HAPI FHIR JPA 启动示例

```yaml
# docker-compose.yml
services:
  fhir:
    image: hapiproject/hapi:latest
    ports: ["8080:8080"]
    environment:
      HAPI_FHIR_SERVER_ADDRESS: http://localhost:8080/fhir
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/hapi
      SPRING_DATASOURCE_USERNAME: hapi
      SPRING_DATASOURCE_PASSWORD: hapi
    depends_on: [db]
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: hapi
      POSTGRES_USER: hapi
      POSTGRES_PASSWORD: hapi
```

启动后即可用 REST 调用：

```bash
curl -X POST http://localhost:8080/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -d '{"resourceType":"Patient","name":[{"family":"张","given":["三"]}]}'
```

## 七、CDR：临床数据仓库

医院用 FHIR 不仅是互操作，还常用来构建 **CDR（Clinical Data Repository）**，作为所有临床数据的中央存储。

### 7.1 CDR 架构

```
HIS ─┐
LIS ─┼─ Integration Engine ─► FHIR API ─► CDR ─► Analytics / ML
PACS ┘         (Mirth)         (FHIR)     (PostgreSQL + FHIR)
```

[Mirth Connect](https://www.nextgen.com/products-and-services/nextgen-connect-integration-engine) 是最常用的开源集成引擎，支持 HL7 v2/v3、FHIR、DICOM 等多种协议互转。

### 7.2 数据湖 + FHIR

大型医疗集团常把所有 FHIR 数据落到数据湖：

```python
# 把 FHIR Bundle 落到 S3 Parquet
import pyarrow.parquet as pq
import pyarrow as pa

def fhir_to_parquet(bundle: dict, s3_path: str):
    patients = [e['resource'] for e in bundle['entry'] if e['resource']['resourceType'] == 'Patient']
    flat = pd.json_normalize(patients)
    table = pa.Table.from_pandas(flat)
    pq.write_table(table, s3_path)
```

这样可以用 Spark / Trino 直接对 FHIR 数据做大规模分析。

## 八、临床决策支持（CDS）

FHIR 的 CDS Hooks 标准让 EHR 在关键时刻调用外部决策服务：

```json
{
  "hook": "patient-view",
  "hookInstance": "abc123",
  "context": {
    "patientId": "123",
    "encounterId": "456"
  }
}
```

CDS 服务返回卡片建议：

```json
{
  "cards": [
    {
      "summary": "建议筛查糖尿病",
      "indicator": "warning",
      "detail": "患者 BMI 30、年龄 > 45，符合糖尿病筛查指征",
      "source": { "label": "Mayo Clinic Guidelines" },
      "links": [{ "label": "下单糖化血红蛋白", "url": "..." }]
    }
  ]
}
```

医生在 EHR 里就能看到智能提示，无须切换系统。

## 九、安全与合规

### 9.1 HIPAA / GDPR

医疗数据是高度敏感信息。HIPAA（美国）和 GDPR（欧洲）规定：

- 数据传输必须加密（TLS 1.2+）
- 静态数据必须加密（at-rest encryption）
- 访问必须审计（audit log）
- 患者有数据访问/删除权

FHIR 提供 **AuditEvent** Resource 标准化审计日志：

```json
{
  "resourceType": "AuditEvent",
  "type": { "code": "rest", "system": "http://dicom.nema.org/resources/ontology/DCM" },
  "subtype": [{ "code": "read", "system": "http://hl7.org/fhir/restful-interaction" }],
  "action": "R",
  "recorded": "2026-07-21T14:30:00Z",
  "source": { "observer": { "reference": "Device/fhir-server" } },
  "entity": [{ "what": { "reference": "Patient/123" } }]
}
```

### 9.2 脱敏与匿名化

临床数据用于科研前必须脱敏。HIPAA Safe Harbor 列出了 18 类必须删除的标识符：

```python
def deidentify_patient(patient: dict) -> dict:
    """HIPAA Safe Harbor 脱敏"""
    patient.pop('name', None)
    patient.pop('address', None)
    patient['identifier'] = [{'system': 'http://study.example.com',
                               'value': hashlib.sha256(original_id).hexdigest()[:16]}]
    # 年龄超过 89 的统一改为 "90+"
    if patient.get('birthDate'):
        age = calc_age(patient['birthDate'])
        if age > 89:
            patient['birthDate'] = None
            patient['_birthDate'] = {'extension': [{'url': '...', 'valueString': '90+'}]}
    return patient
```

## 十、落地实践：从 v2 迁移到 FHIR

### 10.1 分阶段路线图

**阶段一：v2 + FHIR 并存**

集成引擎同时支持 v2 接收和 FHIR 输出。新系统直接对接 FHIR，老系统继续走 v2。

**阶段二：FHIR 内部互操作**

所有院内系统集成改用 FHIR。常见模式是 **FHIR Facade**——把老系统的数据库用 FHIR API 包装一层。

**阶段三：FHIR 跨机构互操作**

区域卫生信息平台用 FHIR 做互操作底座，每个医院通过 FHIR 向平台提交数据。

### 10.2 FHIR Facade 实战

```java
@RestController
@RequestMapping("/fhir/Patient")
public class PatientFacade {

    @GetMapping("/{id}")
    public ResponseEntity<String> getPatient(@PathVariable String id) {
        // 从老 HIS 数据库查询
        LegacyPatient legacy = legacyDao.findPatient(id);
        // 映射到 FHIR Patient
        Patient fhirPatient = mapToFhir(legacy);
        // 序列化为 JSON
        String json = fhirContext.newJsonParser().encodeResourceToString(fhirPatient);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(json);
    }
}
```

### 10.3 数据质量治理

FHIR 标准不能解决"垃圾数据"问题。落地时必须配套：

- 数据质量规则（如 birthDate 必填、gender 必须是枚举值）
- 异常数据监控（缺失率、值域异常率）
- 定期数据清洗任务

## 十一、挑战与未来

### 11.1 FHIR 实现差异

每个厂商对 FHIR Profile 的支持程度不同，导致"理论上互操作、实际还是各玩各的"。**Argonaut Project** 和 **US Core** 试图通过约束 Profile 解决这一问题，但全球统一仍有很长的路。

### 11.2 精准医学与基因组数据

FHIR 正在扩展 **Genomics** 领域（如 MolecularSequence、GenomicsReport Resource），让基因测序结果能像普通检验一样在 EHR 中流转。

### 11.3 AI 与 FHIR

很多 AI 公司把 FHIR 作为模型输入的标准格式：

- 患者风险预测模型直接读 `/Patient/123/$everything`
- 影像 AI 把结果以 `Observation` + `ImagingStudy` 写回 EHR

未来会有更多 **CDS Hooks + AI** 组合，让模型推理结果直接呈现在医生工作流中。

## 结语

医疗信息化的复杂性源于行业本身的复杂性——临床流程、法规约束、多方利益、对错误的零容忍。HL7 FHIR 不是银弹，但它是过去 30 年医疗 IT 领域最接近"通用语言"的尝试。

如果你正在做医疗 IT 项目，记住三件事：

1. **数据模型先于代码**：FHIR Profile 定不下来，开发就是空中楼阁
2. **术语服务是基础设施**：不要让 LOINC/SNOMED CT 映射散落各处
3. **集成引擎是核心**：Mirth、Rhapsody 这些工具的配置质量决定项目成败

医疗 IT 是一个慢工出细活的领域，但每一行正确流转的数据，最终都可能挽救一条生命。

> 下一篇预告：《游戏引擎架构与 Unity 实战：从渲染管线到 ECS》
