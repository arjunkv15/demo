# Application Runtime Usage Report

## 1. Model API Usage Disclosure

The **Ghost Data Audit** application uses **no external AI model APIs** in its application runtime.

All core logic, intent classification, activity correlation, step generation, output validation, and local web serving are implemented exclusively using **deterministic Python rules** and Python standard-library modules.

---

## 2. Runtime Usage Metrics

| Metric | Application Runtime Value | Explanation |
| :--- | :--- | :--- |
| **External Model Calls** | **0** | No calls to OpenAI, Gemini, Anthropic, or any other LLM API during execution. |
| **Input Tokens** | **Not Applicable (0)** | No language model prompts or context tokens processed at runtime. |
| **Output Tokens** | **Not Applicable (0)** | No language model completions generated at runtime. |
| **External API Cost** | **$0.00** | Zero dollar cost; completely self-contained local execution. |
| **Network Dependencies** | **None** | Runs completely offline without outbound internet connections. |

---

## 3. Note on Development Environment

As required by challenge reporting guidelines, no speculative token counts, hypothetical developer tool metrics, or invented figures are reported. Application runtime metrics strictly reflect the actual execution of `app.py`.
