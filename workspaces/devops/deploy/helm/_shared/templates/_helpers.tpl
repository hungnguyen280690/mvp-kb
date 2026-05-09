{{/*
generated_by: Claude Opus 4.7 (DevOps/SRE)
applies_adrs: [ADR-0007]
classification: Public

Helm Helpers — VDBAS TT.OUT.MANUAL
Shared across all service charts.
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "vdbas.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "vdbas.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label values.
*/}}
{{- define "vdbas.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "vdbas.labels" -}}
helm.sh/chart: {{ include "vdbas.chart" . }}
{{ include "vdbas.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: vdbas
environment: {{ .Values.environment | default .Release.Namespace }}
generated_by: "Claude Opus 4.7 (DevOps/SRE)"
{{- end }}

{{/*
Selector labels — used in matchLabels and pod templates.
*/}}
{{- define "vdbas.selectorLabels" -}}
app.kubernetes.io/name: {{ include "vdbas.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service account name.
*/}}
{{- define "vdbas.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "vdbas.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Container image reference.
*/}}
{{- define "vdbas.image" -}}
{{- $registry := .Values.image.registry }}
{{- $repository := .Values.image.repository }}
{{- $name := include "vdbas.name" . }}
{{- $tag := .Values.image.tag | default .Chart.AppVersion }}
{{- printf "%s/%s/%s:%s" $registry $repository $name $tag }}
{{- end }}

{{/*
Database JDBC URL.
*/}}
{{- define "vdbas.jdbcUrl" -}}
jdbc:oracle:thin:@//{{ .Values.database.host }}:{{ .Values.database.port }}/{{ .Values.database.service }}
{{- end }}

{{/*
Logging configuration as Java opts.
*/}}
{{- define "vdbas.javaLoggingOpts" -}}
-Dlogging.level.root={{ .Values.logging.level }}
-Dlogging.pattern.console={{ .Values.logging.format }}
{{- if .Values.logging.auditLevel }}
-Dlogging.level.vdbas.audit={{ .Values.logging.auditLevel }}
{{- end }}
{{- end }}
