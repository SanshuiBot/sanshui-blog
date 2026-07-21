---
title: 机器学习模型部署 MLOps 全流程：从训练到上线
date: 2026-07-21
tags: [MLOps, 机器学习, 后端]
excerpt: 一篇文章打通机器学习模型从训练、验证、打包、部署到监控的全部环节，构建可持续交付的 MLOps 流水线。
---

# 机器学习模型部署 MLOps 全流程：从训练到上线

很多人以为机器学习就是"训练一个模型"，但真正在生产中运行的 ML 系统远不止于此。Google 在《Hidden Technical Debt in Machine Learning Systems》中曾指出：**ML 系统中只有约 5% 的代码是真正的 ML 代码**，剩下 95% 都是基础设施——数据管道、特征工程、模型部署、监控、回滚。

这篇文章会带你走完整个 MLOps 生命周期，并提供可以直接落地的工程实践。

## 一、MLOps 是什么？

MLOps = Machine Learning + DevOps。它是一套让 ML 模型能够**可靠、可重复、自动化地从开发环境走向生产环境**的方法论。

### 1.1 ML 代码 vs 传统代码

传统软件代码是确定性的：同样的输入永远得到同样的输出。但 ML 代码本质是**数据驱动**的：

- 数据分布会随时间漂移（data drift）
- 模型对边缘 case 的预测可能不可靠
- 训练和推理环境不一致会导致微妙 bug

这就是为什么 MLOps 比 DevOps 更复杂——你不仅要管代码版本，还要管**数据版本、模型版本、特征版本**。

### 1.2 MLOps 三个成熟度等级

Google 定义了 MLOps 的三个等级：

| 等级 | 特征 |
|------|------|
| Level 0 | 手动训练、手动部署，没有流水线 |
| Level 1 | 自动化训练流水线，CI/CD 部署模型 |
| Level 2 | 元数据治理、自动化再训练、A/B 测试 |

大多数公司停在 Level 0 到 Level 1 之间。

## 二、数据版本化：DVC

代码用 Git 管，数据用什么？答案是 [DVC（Data Version Control）](https://dvc.org/)。

### 2.1 DVC 基本工作流

```bash
# 初始化
git init
dvc init

# 添加数据
mkdir data
cp /path/to/raw_data.csv data/
dvc add data/raw_data.csv

# 提交
git add data/raw_data.csv.dvc .gitignore
git commit -m "Add raw data v1"

# 修改数据后
dvc add data/raw_data.csv
git commit -am "Update raw data v2"

# 切换版本
git checkout HEAD~1
dvc checkout
```

DVC 的核心思想是：**文件本身存在云存储（S3 / GCS / Azure Blob），Git 只保存指向文件的 .dvc 元数据**。

### 2.2 数据流水线

```bash
# 定义流水线
dvc stage add -n prepare \
  -d src/prepare.py -d data/raw_data.csv \
  -o data/prepared.csv \
  python src/prepare.py

dvc stage add -n train \
  -d src/train.py -d data/prepared.csv \
  -o models/model.pkl \
  python src/train.py

# 执行
dvc repro
```

`dvc repro` 会按依赖关系自动重跑过期的 stage。这就是 DVC 的"make for ML"。

## 三、实验追踪：MLflow

训练模型时，你通常会跑几十个甚至上百个实验，每个实验有不同的超参数。**没有实验追踪，你就是在瞎跑**。

### 3.1 MLflow Tracking API

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

# 启动一次 run
with mlflow.start_run(run_name="rf_baseline"):
    # 记录超参数
    mlflow.log_params({
        "n_estimators": 100,
        "max_depth": 10,
        "random_state": 42,
    })

    # 训练
    model = RandomForestClassifier(
        n_estimators=100, max_depth=10, random_state=42
    )
    model.fit(X_train, y_train)

    # 评估
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")

    # 记录指标
    mlflow.log_metrics({"accuracy": acc, "f1": f1})

    # 保存模型
    mlflow.sklearn.log_model(model, "model")
```

### 3.2 MLflow Model Registry

模型注册表是 MLOps 的核心组件：

```
None ──> Staging ──> Production ──> Archived
```

```python
# 注册模型
result = mlflow.register_model(
    "runs:/abc123/model",
    "RandomForestClassifier",
)

# 通过 client 推进阶段
from mlflow.tracking import MlflowClient
client = MlflowClient()
client.transition_model_version_stage(
    name="RandomForestClassifier",
    version=1,
    stage="Production",
)
```

## 四、模型打包与序列化

### 4.1 Pickle：最简单但最危险

```python
import pickle
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)
```

Pickle 反序列化时会执行任意代码，**绝对不要 pickle 加载来自不可信来源的模型**。

### 4.2 ONNX：跨框架标准

ONNX（Open Neural Network Exchange）让 PyTorch、TensorFlow、scikit-learn 训练的模型可以互相导入导出：

```python
import torch
import torch.onnx

# PyTorch → ONNX
dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model, dummy_input, "model.onnx",
    input_names=["input"], output_names=["output"],
    dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
)
```

ONNX Runtime 可以用 C++、Python、JavaScript 加载模型，是部署到边缘设备的最佳选择。

### 4.3 TorchScript 与 TorchServe

```python
# 将 PyTorch 模型转为 TorchScript
scripted = torch.jit.script(model)
scripted.save("model.pt")

# 加载（不需要 Python 解释器）
loaded = torch.jit.load("model.pt")
```

TorchServe 是 PyTorch 官方推理服务器，支持批量推理、模型版本管理、指标暴露。

### 4.4 Triton Inference Server

NVIDIA Triton 支持多框架（TensorFlow、PyTorch、ONNX、TensorRT），并提供：

- 动态 batching
- 多模型实例并发
- GPU 内存池

配置文件 `config.pbtxt`：

```
name: "resnet50"
platform: "onnxruntime_onnx"
max_batch_size: 256
input [
  { name: "input", data_type: TYPE_FP32, dims: [3, 224, 224] }
]
output [
  { name: "output", data_type: TYPE_FP32, dims: [1000] }
]
dynamic_batching {
  preferred_batch_size: [32, 64, 128]
  max_queue_delay_microseconds: 100000
}
```

## 五、模型部署架构

### 5.1 在线推理（Real-time）

最常见的方式：把模型包装成 HTTP 服务。

```python
# FastAPI + PyTorch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch

app = FastAPI()
model = torch.jit.load("model.pt").eval()

class PredictRequest(BaseModel):
    features: list[float]

@app.post("/predict")
async def predict(req: PredictRequest):
    if len(req.features) != 10:
        raise HTTPException(400, "Expected 10 features")
    x = torch.tensor(req.features, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        logits = model(x)
    return {"prediction": logits.argmax().item()}
```

**优化点**：

- 用 `async` 接收请求，但推理用线程池（避免阻塞 event loop）
- 模型加载用 `@lru_cache` 或 lifespan event 一次性完成
- 配合 `gunicorn -k uvicorn.workers.UvicornWorker` 多进程部署

### 5.2 批量推理（Batch）

不需要实时响应的场景（如夜间报表）用批处理：

```python
# Spark + Pandas UDF
from pyspark.sql.functions import pandas_udf
import pandas as pd

@pandas_udf("double")
def predict_batch(features: pd.Series) -> pd.Series:
    X = pd.DataFrame(features.tolist())
    return pd.Series(model.predict(X))

df = spark.read.parquet("s3://bucket/features/")
df.withColumn("prediction", predict_batch("features")).write.parquet("s3://bucket/predictions/")
```

### 5.3 流式推理（Streaming）

Kafka + Flink 的组合可以处理毫秒级延迟的实时推理：

```
事件源 ──Kafka──> Flink（加载模型 + 推理）──Kafka──> 下游
```

### 5.4 边缘部署

树莓派、手机、IoT 设备：

- 量化（Quantization）：FP32 → INT8，模型体积减少 4 倍
- 剪枝（Pruning）：去除冗余权重
- 知识蒸馏：大模型教小模型

工具链：TensorFlow Lite、PyTorch Mobile、Core ML、ONNX Runtime Mobile。

## 六、特征存储：Feast

模型需要特征，特征需要在训练和推理时**完全一致**。Feast（Feature Store）解决的就是这个问题。

### 6.1 定义特征视图

```python
# feature_repo/driver_features.py
from feast import Entity, FeatureView, Field
from feast.types import Float32, Int64
from datetime import timedelta

driver = Entity(name="driver_id", join_keys=["driver_id"])

driver_stats_fv = FeatureView(
    name="driver_hourly_stats",
    entities=[driver],
    ttl=timedelta(days=365),
    schema=[
        Field(name="conv_rate", dtype=Float32),
        Field(name="acc_rate", dtype=Float32),
        Field(name="avg_daily_trips", dtype=Int64),
    ],
    online=True,  # 启用在线存储
    source=...,   # 数据源（BigQuery、Snowflake、S3）
)
```

### 6.2 训练时获取历史特征

```python
from feast import FeatureStore
import pandas as pd

store = FeatureStore(repo_path="feature_repo")

training_df = store.get_historical_features(
    entity_df=entity_df,  # 包含 driver_id 和 event_timestamp
    features=["driver_hourly_stats:conv_rate", "driver_hourly_stats:acc_rate"],
).to_df()
```

### 6.3 推理时获取在线特征

```python
feature_vector = store.get_online_features(
    features=["driver_hourly_stats:conv_rate", "driver_hourly_stats:acc_rate"],
    entity_rows=[{"driver_id": 1001}],
).to_dict()
```

Feast 后端可以是 Redis（在线）+ S3/BigQuery（离线），保证两个口径一致。

## 七、模型监控：Drift 与 Performance

部署后不是结束，而是开始。你需要持续监控两个维度：

### 7.1 数据漂移（Data Drift）

特征分布发生变化。常用检测方法：

- **PSI（Population Stability Index）**：> 0.25 表示显著漂移
- **KL Divergence**
- **KS Test**：用于连续变量

```python
import numpy as np
from scipy.stats import ks_2samp

def ks_drift_score(reference: np.ndarray, current: np.ndarray) -> float:
    """返回 0-1 的漂移分数，越大越漂移"""
    _, p_value = ks_2samp(reference, current)
    return 1 - p_value
```

### 7.2 概念漂移（Concept Drift）

特征没变，但 X → Y 的映射变了。比如用户行为因疫情彻底改变。

检测方法：

- ADWIN（Adaptive Windowing）
- 模型性能指标连续低于阈值

### 7.3 监控指标体系

| 维度 | 指标 | 工具 |
|------|------|------|
| 系统 | 延迟、QPS、错误率 | Prometheus + Grafana |
| 模型 | Accuracy、AUC | Evidently、WhyLabs |
| 数据 | PSI、缺失率 | Alibi Detect |
| 业务 | 转化率、GMV | 自建 BI |

### 7.4 实战：Prometheus 暴露推理指标

```python
from prometheus_client import Counter, Histogram, start_http_server

PREDICTION_TOTAL = Counter(
    "model_prediction_total", "Total predictions", ["model_version"]
)
PREDICTION_LATENCY = Histogram(
    "model_prediction_latency_seconds", "Prediction latency"
)

@app.post("/predict")
async def predict(req: PredictRequest):
    start = time.time()
    result = run_inference(req.features)
    PREDICTION_LATENCY.observe(time.time() - start)
    PREDICTION_TOTAL.labels(model_version="v1.2.0").inc()
    return {"prediction": result}
```

## 八、CI/CD 流水线

### 8.1 GitHub Actions 自动化训练

```yaml
name: Train Model
on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * 0'  # 每周日凌晨 2 点

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - name: Install deps
        run: pip install -r requirements.txt
      - name: Pull data
        run: dvc pull
      - name: Train
        run: dvc repro train
      - name: Run tests
        run: pytest tests/ -v
      - name: Register model
        if: success()
        run: python scripts/register_model.py
      - name: Push data
        run: |
          git config user.name "bot"
          git config user.email "bot@example.com"
          git add .
          git commit -m "Auto: retrain model [skip ci]"
          git push
```

### 8.2 Shadow Deployment

新模型先"影子"上线——接收同样流量但不返回结果，对比预测差异：

```python
@app.post("/predict")
async def predict(req: PredictRequest):
    primary = primary_model.predict(req.features)

    # 异步触发影子模型
    if shadow_enabled:
        asyncio.create_task(run_shadow(req, primary))

    return {"prediction": primary}

async def run_shadow(req, primary_result):
    shadow = shadow_model.predict(req.features)
    log_comparison(req.id, primary_result, shadow)
```

只有当影子模型在数千次请求中表现稳定优于主模型时，才提升为 Production。

## 九、MLOps 工具栈全景图

### 9.1 商业方案

- **Vertex AI Pipelines**（GCP）：与 BigQuery、GCS 深度集成
- **SageMaker Pipelines**（AWS）：端到端托管
- **Azure ML**：企业级 ML 工作流

### 9.2 开源组合

| 环节 | 工具 |
|------|------|
| 数据版本 | DVC、LakeFS、Pachyderm |
| 实验追踪 | MLflow、Weights & Biases、Neptune |
| 模型注册 | MLflow Model Registry、Vertex AI Model Registry |
| 特征存储 | Feast、Tecton、Hopsworks |
| 模型服务 | Triton、TorchServe、BentoML、Seldon Core |
| 监控 | Evidently、WhyLabs、Arize |

### 9.3 推荐"穷人版"组合

适合中小团队、个人项目：

```
DVC（数据版本） + MLflow（实验追踪） + FastAPI（在线服务） + Airflow（调度） + Prometheus（监控）
```

全部开源、全部可在 K8s 上跑。

## 十、生产环境最佳实践

### 10.1 训练-服务偏差（Training-Serving Skew）

最常见的 bug 来源。三个口子：

1. **特征处理不一致**：训练用 sklearn Pipeline，服务用裸代码
2. **数据分布不一致**：训练用 2023 年数据，服务遇到 2024 年的分布
3. **标签延迟**：业务标签几天后才回流，模型评估失真

**解决方案**：

- 用 [sklearn-pandas](https://github.com/scikit-learn-contrib/sklearn-pandas) 或 [pandera](https://github.com/unionai-oss/pandera) 强制 schema
- 特征存进 Feast，训练和服务都从同一个特征视图取数
- 用 [Airflow Sensor](https://airflow.apache.org/docs/apache-airflow/stable/_api/airflow/sensors/index.html) 等待标签完整再触发评估

### 10.2 模型版本管理

- 模型文件命名：`{model_name}-{version}-{short_hash}.{ext}`
- 元数据必须包含：训练数据 commit、代码 commit、超参数、训练指标、评估指标
- 模型与代码版本解耦——同一个代码 commit 可以训练多个模型版本

### 10.3 推理优化技巧

- ** batching**：单次请求只预测 1 个样本，吞吐差 10 倍。把请求 buffer 100ms 再批量送入模型
- **模型量化**：FP32 → FP16 → INT8。INT8 推理速度通常快 2-3 倍
- **图优化**：[TensorRT](https://developer.nvidia.com/tensorrt) 自动做层融合、kernel auto-tuning
- **缓存**：相同输入的预测结果缓存 5 分钟（业务允许时）

### 10.4 模型治理与合规

- **可解释性**：用 [SHAP](https://github.com/shap/shap) 或 [LIME](https://github.com/marcotcr/lime) 给每个预测生成特征贡献
- **公平性**：用 [Fairlearn](https://fairlearn.org/) 检测不同人群的指标差异
- **审计日志**：记录每次预测的输入、输出、模型版本、时间戳
- **数据 lineage**：每个模型都能追溯到训练数据的来源和版本

## 结语

MLOps 是一门还在快速演进的工程学科。没有人能做到"完美 MLOps"，但你能做到：

1. 代码、数据、模型**都可版本化、可复现**
2. 实验**可追踪**、可对比
3. 部署**可灰度、可回滚**
4. 监控**覆盖系统、模型、数据三层**

把这些基础设施搭好，你的团队就能从"每季度发一个模型"进化到"每周发一个模型"——这是真正的工程胜利。

> 下一篇预告：《金融量化交易系统设计：从 tick 数据到策略回测》
