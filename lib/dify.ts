export type DifyLocalizedText = string | { en_US?: string; zh_Hans?: string; zh_CN?: string } | null | undefined

export type DifyFormOption = {
  label?: DifyLocalizedText
  value?: string | number | boolean
}

type DifyFormFieldBase = {
  label?: DifyLocalizedText
  variable?: string
  required?: boolean
  default?: unknown
  placeholder?: DifyLocalizedText
  options?: DifyFormOption[]
}

export type DifyFormFieldConfig = DifyFormFieldBase & Record<string, unknown>

export type DifyFormField = Record<string, DifyFormFieldConfig>

export type DifyParametersResponse = {
  opening_statement?: string
  user_input_form?: DifyFormField[]
}

export function getDifyBaseUrl() {
  return (process.env.DIFY_API_BASE_URL || "https://api.dify.ai/v1").replace(/\/$/, "")
}

export function getDifyApiKey() {
  return process.env.DIFY_EV_AGENT || process.env.DIFY_API_KEY || ""
}
