# 🔬 Dual-Model Machine Learning Architecture: Single-Node vs. Distributed Spark MLlib

This directory contains the finalized, production-aligned training and benchmarking Jupyter Notebooks for the **AgriGuard-IoT** Decision Support System. The core research focus is evaluating the trade-offs between **Single-Node In-Memory Machine Learning** (LightGBM / Scikit-learn) and **Distributed Big Data Machine Learning** (Apache Spark MLlib / PySpark) on a standardized agricultural sensor dataset of **200,000 records**.

---

## 📂 Notebooks Overview

| Notebook File | Architecture | Framework | Primary Model | Key Metrics (ROC-AUC / Test Acc) | Training Time |
| :--- | :--- | :--- | :--- | :---: | :---: |
| [**`big-data-mainmodel.ipynb`**](./big-data-mainmodel.ipynb) | Single-Node (In-Memory) | LightGBM, Scikit-learn | **LightGBM Booster** | **0.8299** / **94.80%** | **1.25s** |
| [**`apache-spark-mlib-model.ipynb`**](./apache-spark-mlib-model.ipynb) | Distributed (6 Partitions) | Apache Spark MLlib, PySpark | **Spark GBTClassifier** | **0.8340** / **94.07%** | **21.42s** |

---

## 📊 1. Single-Node Pipeline (`big-data-mainmodel.ipynb`)

* **Target Problem:** Binary classification of plant ecological stress (`Eco-Stress Risk`: 0 = Optimal Growth, 1 = Stress Danger).
* **Data Scale:** 200,000 sensor observations $\times$ 20 numerical & categorical features.
* **Trained Models:**
  1. **LightGBM Booster (Champion):** Early stopping at 12 iterations (total 42 trees), optimal threshold calibration $T^* \approx 0.34$, maximizing F1-score and recall on rare stress events.
  2. **Random Forest (Scikit-learn):** 100 trees, balanced class weights.
  3. **Logistic Regression (L2 Penalty):** Standardized linear baseline.
  4. **Decision Tree (CART):** Interpretable tree baseline.
* **Key Visualizations:**
  * Training Loss & Convergence Curves (Early stopping analysis).
  * Precision-Recall (PR) and ROC Curves with Optimal Threshold ($T^*$).
  * Feature Importance (Gini & Split Gain).
  * Confusion Matrix on Test Set ($N = 40,000$).
  * Fair Multi-Model Comparative Benchmark Chart.

---

## ⚡ 2. Distributed Big Data Pipeline (`apache-spark-mlib-model.ipynb`)

* **Cluster Configuration:** Apache Spark 3.x with 6 RDD Partitions, in-memory DataFrame API, distributed lazy execution DAG.
* **Distributed Pipeline Components:**
  * `VectorAssembler`: Assembles 20 feature columns into a dense distributed feature vector.
  * `StandardScaler`: Distributed zero-mean and unit-variance normalization.
  * Stratified 80/20 train/test split preserving class distribution.
* **Distributed Models:**
  1. **Spark GBTClassifier (Champion):** 30 boosting iterations, step size 0.1, distributed tree building via parallel histogram aggregation.
  2. **Spark RandomForestClassifier:** 30 distributed trees.
  3. **Spark LogisticRegression:** Distributed gradient descent via L-BFGS.
  4. **Spark DecisionTreeClassifier:** Distributed CART.
* **Key Insights:**
  * **Distributed Shuffle Overhead:** On a 25MB (200k rows) dataset, Spark takes 21.42s vs LightGBM's 1.25s due to JVM initialization, DAG scheduling, and network serialization overhead.
  * **Horizontal Scalability:** Spark demonstrates linear scaling behavior ($O(N/P)$) when scaling to tens of millions of rows, where single-node libraries encounter Out-Of-Memory (OOM) failures.
  * **Mathematical Parity:** Spark MLlib achieves ROC-AUC of **0.8340** vs LightGBM's **0.8299**, confirming that distributed parallelization preserves model predictive power without accuracy degradation.

---

## ⚖️ Comprehensive Benchmark Comparison

| Metric | Single-Node: LightGBM | Distributed: Apache Spark MLlib (GBT) | Delta / Finding |
| :--- | :---: | :---: | :--- |
| **ROC-AUC** | **0.8299** | **0.8340** | +0.0041 (Spark MLlib slightly higher) |
| **PR-AUC (Average Precision)** | **0.7192** | **0.7330** | +0.0138 (Consistent precision-recall tradeoff) |
| **Test Accuracy** | **94.80%** | **94.07%** | -0.73% (Virtually identical) |
| **F1-Score (Stress Class)** | **0.9412** | **0.9230** | Comparable balance between precision and recall |
| **Training Time (200k rows)** | **1.25s** | **21.42s** | LightGBM is ~17x faster on medium RAM-fitting data |
| **Serving Latency** | **< 15ms** | **~100ms** | LightGBM selected for Real-time Serving Layer |
| **Scalability Limit** | Bound by Single-Node RAM | Horizontally scalable across Worker Nodes | Spark required for 100M+ streaming rows |

---

## 🚀 How to Execute

### Option A: Local Jupyter Environment
```bash
# Activate your Python virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install notebook dependencies
pip install jupyterlab lightgbm pyspark scikit-learn matplotlib seaborn pandas numpy

# Launch JupyterLab
jupyter lab
```

### Option B: Kaggle / Google Colab
1. Upload either notebook to Kaggle Notebooks or Google Colab.
2. If running on Kaggle, the notebook automatically resolves the dataset from `../input/smart-agricultural-dataset-predict-plant-health/`.
3. If running locally, the notebook reads directly from `../data/agri_iot_200k.csv` or falls back to synthetic generation.
