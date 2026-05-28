{{/*
Common labels applied to all resources
*/}}
{{- define "restauranty.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Backend env vars pulled from the shared secret
*/}}
{{- define "restauranty.secretEnv" -}}
- name: MONGODB_URI
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: MONGODB_URI
- name: SECRET
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: SECRET
- name: ORIGIN
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: ORIGIN
- name: CLOUD_NAME
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: CLOUD_NAME
- name: CLOUD_API_KEY
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: CLOUD_API_KEY
- name: CLOUD_API_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: CLOUD_API_SECRET
{{- end }}
