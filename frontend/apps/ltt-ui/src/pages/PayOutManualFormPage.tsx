import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useForm,
  useFieldArray,
  Controller,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as Tabs from "@radix-ui/react-tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";

import { MoneyInput } from "../components/MoneyInput";
import { DatePickerField } from "../components/DatePickerField";
import { LovSelect } from "../components/LovSelect";
import { LoadingSpinner } from "../components/LoadingSpinner";

import { usePayOrderDetail, useCreatePayOrder, queryKeys } from "../api/hooks";
import { payOutManualApi } from "../api/pay-out-manual";
import type { PayOrderRequest } from "../types/pay-order";
import { formatCurrency } from "../lib/utils";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const lineSchema = z.object({
  lineNum: z.number(),
  lineAmount: z
    .number({ error: "Số tiền bắt buộc" })
    .positive("Số tiền phải lớn hơn 0"),
  lineDescription: z.string().optional(),
  ccidSegment1: z.string().min(1, "Bắt buộc"),
  ccidSegment2: z.string().min(1, "Bắt buộc"),
  ccidSegment3: z.string().min(1, "Bắt buộc"),
  ccidSegment4: z.string().min(1, "Bắt buộc"),
  ccidSegment5: z.string().min(1, "Bắt buộc"),
  ccidSegment6: z.string().min(1, "Bắt buộc"),
  ccidSegment7: z.string().min(1, "Bắt buộc"),
  ccidSegment8: z.string().min(1, "Bắt buộc"),
  ccidSegment9: z.string().min(1, "Bắt buộc"),
  ccidSegment10: z.string().min(1, "Bắt buộc"),
  ccidSegment11: z.string().min(1, "Bắt buộc"),
  ccidSegment12: z.string().min(1, "Bắt buộc"),
});

const formSchema = z.object({
  channel: z.enum(["LNH", "TTSP", "LIEN_KHO_BAC"]),
  lnhTransactionType: z.string().optional(),
  paymentDate: z.string().min(1, "Ngày thanh toán bắt buộc"),
  currencyCode: z.string().min(1, "Mã tiền tệ bắt buộc"),
  exchangeRate: z.number().optional(),
  description: z.string().min(1, "Nội dung bắt buộc"),
  originNum: z.string().optional(),
  transactionDate: z.string().optional(),
  expType: z.string().optional(),
  fnCode1: z.string().optional(),
  fnCode2: z.string().optional(),
  fnAmount: z.number().optional(),
  sender: z.string().min(1, "Ngân hàng chuyển bắt buộc"),
  receiver: z.string().min(1, "Ngân hàng nhận bắt buộc"),
  orderType: z.string().optional(),
  // Tab 3 — Người chuyển
  senderName: z.string().min(1, "Tên người chuyển bắt buộc"),
  senderAddress: z.string().min(1, "Địa chỉ người chuyển bắt buộc"),
  senderGlSegment2: z.string().min(1, "GL Segment 2 bắt buộc"),
  senderNum: z.string().optional(),
  senderBankCode: z.string().min(1, "Mã ngân hàng bắt buộc"),
  senderIdentifyId: z.string().optional(),
  senderIssuedDate: z.string().optional(),
  senderIssuedPlace: z.string().optional(),
  tpcpCode: z.string().optional(),
  // Tab 4 — Người nhận
  receiverName: z.string().min(1, "Tên người nhận bắt buộc"),
  receiverAddress: z.string().optional(),
  receiverGlSegment2: z.string().min(1, "GL Segment 2 bắt buộc"),
  receiverBankCode: z.string().min(1, "Mã ngân hàng bắt buộc"),
  receiverAccountName: z.string().min(1, "Tên tài khoản bắt buộc"),
  receiverIdentifyId: z.string().optional(),
  receiverIssuedDate: z.string().optional(),
  receiverIssuedPlace: z.string().optional(),
  // Lines
  lines: z.array(lineSchema).min(1, "Phải có ít nhất một khoản mục"),
});

// Draft schema — no required field validation (except basic types)
const draftSchema = formSchema.partial().extend({
  channel: z.enum(["LNH", "TTSP", "LIEN_KHO_BAC"]).optional(),
  paymentDate: z.string().optional(),
  currencyCode: z.string().optional(),
  description: z.string().optional(),
  sender: z.string().optional(),
  receiver: z.string().optional(),
  senderName: z.string().optional(),
  senderAddress: z.string().optional(),
  senderGlSegment2: z.string().optional(),
  senderBankCode: z.string().optional(),
  receiverName: z.string().optional(),
  receiverGlSegment2: z.string().optional(),
  receiverBankCode: z.string().optional(),
  receiverAccountName: z.string().optional(),
  lines: z
    .array(lineSchema.partial().extend({ lineNum: z.number() }))
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Default line factory
// ---------------------------------------------------------------------------
function makeEmptyLine(lineNum: number): FormValues["lines"][0] {
  return {
    lineNum,
    lineAmount: 0,
    lineDescription: "",
    ccidSegment1: "",
    ccidSegment2: "",
    ccidSegment3: "",
    ccidSegment4: "",
    ccidSegment5: "",
    ccidSegment6: "",
    ccidSegment7: "",
    ccidSegment8: "",
    ccidSegment9: "",
    ccidSegment10: "",
    ccidSegment11: "",
    ccidSegment12: "",
  };
}

// ---------------------------------------------------------------------------
// VDBAS design tokens (inline styles)
// ---------------------------------------------------------------------------
const S = {
  // Input / Select / Textarea
  input: {
    height: "32px",
    width: "100%",
    padding: "4px 8px",
    fontSize: "13px",
    border: "1px solid #d7dbe0",
    borderRadius: "4px",
    outline: "none",
    background: "#fff",
    color: "#1f2328",
    boxSizing: "border-box" as const,
  },
  select: {
    height: "32px",
    width: "100%",
    padding: "4px 8px",
    fontSize: "13px",
    border: "1px solid #d7dbe0",
    borderRadius: "4px",
    outline: "none",
    background: "#fff",
    color: "#1f2328",
    boxSizing: "border-box" as const,
  },
  textarea: {
    width: "100%",
    padding: "6px 8px",
    fontSize: "13px",
    border: "1px solid #d7dbe0",
    borderRadius: "4px",
    outline: "none",
    background: "#fff",
    color: "#1f2328",
    resize: "vertical" as const,
    minHeight: "72px",
    boxSizing: "border-box" as const,
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#333",
    marginBottom: "4px",
  },
  errorMsg: {
    fontSize: "12px",
    color: "#cc0000",
    marginTop: "3px",
  },
  // Buttons
  btnDefault: {
    height: "32px",
    padding: "0 14px",
    fontSize: "12.5px",
    fontWeight: 600,
    borderRadius: "4px",
    border: "1px solid #d7dbe0",
    background: "#fff",
    color: "#333",
    cursor: "pointer",
    transition: "all .15s",
  } as React.CSSProperties,
  btnPrimary: {
    height: "32px",
    padding: "0 14px",
    fontSize: "12.5px",
    fontWeight: 600,
    borderRadius: "4px",
    border: "1px solid #0b5394",
    background: "#0b5394",
    color: "#fff",
    cursor: "pointer",
    transition: "all .15s",
  } as React.CSSProperties,
  btnGhost: {
    height: "32px",
    padding: "0 14px",
    fontSize: "12.5px",
    fontWeight: 600,
    borderRadius: "4px",
    border: "1px solid #c6d6e6",
    background: "#fff",
    color: "#0b5394",
    cursor: "pointer",
    transition: "all .15s",
  } as React.CSSProperties,
  btnDangerSm: {
    height: "26px",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "4px",
    border: "1px solid #e7c2c2",
    background: "#fff",
    color: "#cc0000",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all .15s",
  } as React.CSSProperties,
};

const CCID_KEYS = [
  "ccidSegment1",
  "ccidSegment2",
  "ccidSegment3",
  "ccidSegment4",
  "ccidSegment5",
  "ccidSegment6",
  "ccidSegment7",
  "ccidSegment8",
  "ccidSegment9",
  "ccidSegment10",
  "ccidSegment11",
  "ccidSegment12",
] as const;

// ---------------------------------------------------------------------------
// Reusable inline FormGroup (VDBAS-styled, wraps label + field + error)
// ---------------------------------------------------------------------------
function FG({
  label,
  required,
  error,
  children,
  span3,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  span3?: boolean;
}) {
  return (
    <div style={span3 ? { gridColumn: "span 3" } : undefined}>
      <label style={S.label}>
        {label}
        {required && (
          <span style={{ color: "#cc0000", marginLeft: "2px" }}>*</span>
        )}
      </label>
      {children}
      {error && <p style={S.errorMsg}>{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PayOutManualFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();

  // Data fetch (edit mode)
  const { data: orderData, isLoading: isLoadingOrder } = usePayOrderDetail(
    id ?? "",
  );

  // Form
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channel: "TTSP",
      currencyCode: "VND",
      lines: [makeEmptyLine(1)],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (orderData) {
      reset({
        channel: orderData.channel,
        lnhTransactionType: orderData.lnhTransactionType ?? "",
        paymentDate: orderData.paymentDate,
        currencyCode: orderData.currencyCode,
        exchangeRate: orderData.exchangeRate,
        description: orderData.description,
        originNum: orderData.originNum ?? "",
        transactionDate: orderData.transactionDate ?? "",
        expType: orderData.expType ?? "",
        fnCode1: orderData.fnCode1 ?? "",
        fnCode2: orderData.fnCode2 ?? "",
        fnAmount: orderData.fnAmount,
        sender: orderData.sender,
        receiver: orderData.receiver,
        orderType: orderData.orderType ?? "",
        senderName: orderData.senderName,
        senderAddress: orderData.senderAddress,
        senderGlSegment2: orderData.senderGlSegment2,
        senderNum: orderData.senderNum ?? "",
        senderBankCode: orderData.senderBankCode,
        senderIdentifyId: orderData.senderIdentifyId ?? "",
        senderIssuedDate: orderData.senderIssuedDate ?? "",
        senderIssuedPlace: orderData.senderIssuedPlace ?? "",
        tpcpCode: orderData.tpcpCode ?? "",
        receiverName: orderData.receiverName,
        receiverAddress: orderData.receiverAddress ?? "",
        receiverGlSegment2: orderData.receiverGlSegment2,
        receiverBankCode: orderData.receiverBankCode,
        receiverAccountName: orderData.receiverAccountName,
        receiverIdentifyId: orderData.receiverIdentifyId ?? "",
        receiverIssuedDate: orderData.receiverIssuedDate ?? "",
        receiverIssuedPlace: orderData.receiverIssuedPlace ?? "",
        lines: orderData.lines.map((l) => ({
          lineNum: l.lineNum,
          lineAmount: l.lineAmount,
          lineDescription: l.lineDescription ?? "",
          ccidSegment1: l.ccidSegment1,
          ccidSegment2: l.ccidSegment2,
          ccidSegment3: l.ccidSegment3,
          ccidSegment4: l.ccidSegment4,
          ccidSegment5: l.ccidSegment5,
          ccidSegment6: l.ccidSegment6,
          ccidSegment7: l.ccidSegment7,
          ccidSegment8: l.ccidSegment8,
          ccidSegment9: l.ccidSegment9,
          ccidSegment10: l.ccidSegment10,
          ccidSegment11: l.ccidSegment11,
          ccidSegment12: l.ccidSegment12,
        })),
      });
    }
  }, [orderData, reset]);

  // Field array — lines
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // Watched values
  const watchedChannel = watch("channel");
  const watchedCurrency = watch("currencyCode");
  const watchedLines = watch("lines");

  const totalAmount = useMemo(
    () =>
      (watchedLines ?? []).reduce((sum, l) => sum + (l?.lineAmount ?? 0), 0),
    [watchedLines],
  );

  // Mutations
  const createMutation = useCreatePayOrder();

  const updateMutation = useMutation({
    mutationFn: (data: PayOrderRequest) => {
      if (!id || !orderData) throw new Error("No id");
      return payOutManualApi
        .update(id, data, orderData.version)
        .then((r) => r.data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(data.id) });
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ savedId, version }: { savedId: string; version: number }) =>
      payOutManualApi.submit(savedId, version),
    onSuccess: (_data, { savedId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(savedId) });
    },
  });

  // Build PayOrderRequest from form values
  function buildRequest(values: FormValues): PayOrderRequest {
    return {
      channel: values.channel,
      orderType: values.orderType || undefined,
      lnhTransactionType: values.lnhTransactionType || undefined,
      sender: values.sender,
      receiver: values.receiver,
      paymentDate: values.paymentDate,
      currencyCode: values.currencyCode,
      exchangeRate: values.exchangeRate,
      originNum: values.originNum || undefined,
      transactionDate: values.transactionDate || undefined,
      expType: values.expType || undefined,
      fnCode1: values.fnCode1 || undefined,
      fnCode2: values.fnCode2 || undefined,
      fnAmount: values.fnAmount,
      description: values.description,
      senderName: values.senderName,
      senderAddress: values.senderAddress,
      senderGlSegment2: values.senderGlSegment2,
      senderNum: values.senderNum || undefined,
      senderBankCode: values.senderBankCode,
      senderIdentifyId: values.senderIdentifyId || undefined,
      senderIssuedDate: values.senderIssuedDate || undefined,
      senderIssuedPlace: values.senderIssuedPlace || undefined,
      tpcpCode: values.tpcpCode || undefined,
      receiverName: values.receiverName,
      receiverAddress: values.receiverAddress || undefined,
      receiverGlSegment2: values.receiverGlSegment2,
      receiverBankCode: values.receiverBankCode,
      receiverAccountName: values.receiverAccountName,
      receiverIdentifyId: values.receiverIdentifyId || undefined,
      receiverIssuedDate: values.receiverIssuedDate || undefined,
      receiverIssuedPlace: values.receiverIssuedPlace || undefined,
      lines: values.lines.map((l, idx) => ({
        lineNum: idx + 1,
        lineAmount: l.lineAmount,
        lineDescription: l.lineDescription || undefined,
        ccidSegment1: l.ccidSegment1,
        ccidSegment2: l.ccidSegment2,
        ccidSegment3: l.ccidSegment3,
        ccidSegment4: l.ccidSegment4,
        ccidSegment5: l.ccidSegment5,
        ccidSegment6: l.ccidSegment6,
        ccidSegment7: l.ccidSegment7,
        ccidSegment8: l.ccidSegment8,
        ccidSegment9: l.ccidSegment9,
        ccidSegment10: l.ccidSegment10,
        ccidSegment11: l.ccidSegment11,
        ccidSegment12: l.ccidSegment12,
      })),
    };
  }

  // Save as draft — bypass validation
  async function handleSaveDraft() {
    const raw = watch();
    // Build a partial request with what we have, using draft schema for safety
    const parsed = draftSchema.safeParse(raw);
    const values = parsed.success ? parsed.data : raw;

    const req: Partial<PayOrderRequest> & Pick<PayOrderRequest, "lines"> = {
      channel: (values.channel as PayOrderRequest["channel"]) ?? "TTSP",
      orderType: values.orderType || undefined,
      lnhTransactionType: values.lnhTransactionType || undefined,
      sender: values.sender ?? "",
      receiver: values.receiver ?? "",
      paymentDate: values.paymentDate ?? new Date().toISOString().split("T")[0],
      currencyCode: values.currencyCode ?? "VND",
      exchangeRate: values.exchangeRate,
      originNum: values.originNum || undefined,
      transactionDate: values.transactionDate || undefined,
      expType: values.expType || undefined,
      fnCode1: values.fnCode1 || undefined,
      fnCode2: values.fnCode2 || undefined,
      fnAmount: values.fnAmount,
      description: values.description ?? "",
      senderName: values.senderName ?? "",
      senderAddress: values.senderAddress ?? "",
      senderGlSegment2: values.senderGlSegment2 ?? "",
      senderNum: values.senderNum || undefined,
      senderBankCode: values.senderBankCode ?? "",
      senderIdentifyId: values.senderIdentifyId || undefined,
      senderIssuedDate: values.senderIssuedDate || undefined,
      senderIssuedPlace: values.senderIssuedPlace || undefined,
      tpcpCode: values.tpcpCode || undefined,
      receiverName: values.receiverName ?? "",
      receiverAddress: values.receiverAddress || undefined,
      receiverGlSegment2: values.receiverGlSegment2 ?? "",
      receiverBankCode: values.receiverBankCode ?? "",
      receiverAccountName: values.receiverAccountName ?? "",
      receiverIdentifyId: values.receiverIdentifyId || undefined,
      receiverIssuedDate: values.receiverIssuedDate || undefined,
      receiverIssuedPlace: values.receiverIssuedPlace || undefined,
      lines: ((values.lines ?? []) as FormValues["lines"]).map((l, idx) => ({
        lineNum: idx + 1,
        lineAmount: l?.lineAmount ?? 0,
        lineDescription: l?.lineDescription || undefined,
        ccidSegment1: l?.ccidSegment1 ?? "",
        ccidSegment2: l?.ccidSegment2 ?? "",
        ccidSegment3: l?.ccidSegment3 ?? "",
        ccidSegment4: l?.ccidSegment4 ?? "",
        ccidSegment5: l?.ccidSegment5 ?? "",
        ccidSegment6: l?.ccidSegment6 ?? "",
        ccidSegment7: l?.ccidSegment7 ?? "",
        ccidSegment8: l?.ccidSegment8 ?? "",
        ccidSegment9: l?.ccidSegment9 ?? "",
        ccidSegment10: l?.ccidSegment10 ?? "",
        ccidSegment11: l?.ccidSegment11 ?? "",
        ccidSegment12: l?.ccidSegment12 ?? "",
      })),
    };

    try {
      let savedId: string;
      if (isEdit && id) {
        const data = await updateMutation.mutateAsync(req as PayOrderRequest);
        savedId = data.id;
      } else {
        const res = await createMutation.mutateAsync(req as PayOrderRequest);
        savedId = res.data.id;
      }
      navigate(`/pay-out-manual/${savedId}`);
    } catch {
      // error handled via mutation state
    }
  }

  // Save and submit — full validation
  const onSaveAndSubmit: SubmitHandler<FormValues> = async (values) => {
    const req = buildRequest(values);
    try {
      let savedId: string;
      let version: number;
      if (isEdit && id && orderData) {
        const data = await updateMutation.mutateAsync(req);
        savedId = data.id;
        version = data.version;
      } else {
        const res = await createMutation.mutateAsync(req);
        savedId = res.data.id;
        version = res.data.version;
      }
      await submitMutation.mutateAsync({ savedId, version });
      navigate(`/pay-out-manual/${savedId}`);
    } catch {
      // error handled via mutation state
    }
  };

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitMutation.isPending ||
    isSubmitting;

  const saveError =
    createMutation.error?.message ??
    updateMutation.error?.message ??
    submitMutation.error?.message;

  // Loading state for edit
  if (isEdit && isLoadingOrder) {
    return (
      <div
        style={{
          display: "flex",
          height: "256px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        padding: "16px 20px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* ── Header Card ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #d7dbe0",
          borderRadius: "6px",
          boxShadow: "0 1px 2px rgba(15,20,25,.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid #d7dbe0",
            background: "#eef3f9",
          }}
        >
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#073763",
              textTransform: "uppercase",
              letterSpacing: ".3px",
              margin: 0,
            }}
          >
            {isEdit ? "CHỈNH SỬA LỆNH THANH TOÁN" : "TẠO LỆNH THANH TOÁN"}
          </h2>
          <span style={{ fontSize: "11px", color: "#5f6368", fontWeight: 500 }}>
            TT_LTT.3
          </span>
        </div>

        {/* Error banner */}
        {saveError && (
          <div
            style={{
              margin: "12px 14px 0",
              padding: "8px 12px",
              background: "#fde7e7",
              border: "1px solid #e7c2c2",
              borderRadius: "4px",
              fontSize: "13px",
              color: "#cc0000",
            }}
          >
            {saveError}
          </div>
        )}

        {/* Tabs */}
        <Tabs.Root defaultValue="general">
          <Tabs.List
            style={{
              display: "flex",
              borderBottom: "1px solid #d7dbe0",
              padding: "0 14px",
              background: "#fff",
            }}
          >
            {[
              { value: "general", label: "Thông tin chung" },
              { value: "lines", label: "Khoản mục" },
              { value: "sender", label: "Người chuyển" },
              { value: "receiver", label: "Người nhận" },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: "2px solid transparent",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#5f6368",
                  cursor: "pointer",
                  transition: "all .15s",
                  marginBottom: "-1px",
                }}
                className="vdbas-tab-trigger"
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 1: Thông tin chung                                            */}
          {/* ---------------------------------------------------------------- */}
          <Tabs.Content value="general" style={{ padding: "14px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "12px 18px",
              }}
            >
              {/* channel */}
              <FG
                label="Kênh giao dịch"
                required
                error={errors.channel?.message}
              >
                <Controller
                  name="channel"
                  control={control}
                  render={({ field }) => (
                    <select {...field} style={S.select}>
                      <option value="TTSP">TTSP</option>
                      <option value="LNH">LNH</option>
                      <option value="LIEN_KHO_BAC">LIEN_KHO_BAC</option>
                    </select>
                  )}
                />
              </FG>

              {/* lnhTransactionType — only when channel=LNH */}
              {watchedChannel === "LNH" && (
                <FG
                  label="Loại giao dịch LNH"
                  error={errors.lnhTransactionType?.message}
                >
                  <input
                    {...register("lnhTransactionType")}
                    style={S.input}
                    placeholder="Nhập loại giao dịch LNH…"
                  />
                </FG>
              )}

              {/* paymentDate */}
              <FG
                label="Ngày thanh toán"
                required
                error={errors.paymentDate?.message}
              >
                <Controller
                  name="paymentDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? "")}
                    />
                  )}
                />
              </FG>

              {/* currencyCode */}
              <FG
                label="Mã tiền tệ"
                required
                error={errors.currencyCode?.message}
              >
                <input
                  {...register("currencyCode")}
                  style={S.input}
                  placeholder="VND"
                  defaultValue="VND"
                />
              </FG>

              {/* exchangeRate — only when currency != VND */}
              {watchedCurrency && watchedCurrency !== "VND" && (
                <FG label="Tỷ giá" error={errors.exchangeRate?.message}>
                  <input
                    {...register("exchangeRate", { valueAsNumber: true })}
                    type="number"
                    step="0.0001"
                    min={0}
                    style={S.input}
                    placeholder="Nhập tỷ giá…"
                  />
                </FG>
              )}

              {/* sender */}
              <FG
                label="Ngân hàng chuyển"
                required
                error={errors.sender?.message}
              >
                <Controller
                  name="sender"
                  control={control}
                  render={({ field }) => (
                    <LovSelect
                      type="bank"
                      value={field.value}
                      onChange={(code) => field.onChange(code)}
                      placeholder="-- Chọn ngân hàng chuyển --"
                    />
                  )}
                />
              </FG>

              {/* receiver */}
              <FG
                label="Ngân hàng nhận"
                required
                error={errors.receiver?.message}
              >
                <Controller
                  name="receiver"
                  control={control}
                  render={({ field }) => (
                    <LovSelect
                      type="bank"
                      value={field.value}
                      onChange={(code) => field.onChange(code)}
                      placeholder="-- Chọn ngân hàng nhận --"
                    />
                  )}
                />
              </FG>

              {/* originNum */}
              <FG label="Số gốc" error={errors.originNum?.message}>
                <input
                  {...register("originNum")}
                  style={S.input}
                  placeholder="Nhập số gốc…"
                />
              </FG>

              {/* transactionDate */}
              <FG
                label="Ngày giao dịch"
                error={errors.transactionDate?.message}
              >
                <Controller
                  name="transactionDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? "")}
                    />
                  )}
                />
              </FG>

              {/* expType */}
              <FG label="Loại chi" error={errors.expType?.message}>
                <input
                  {...register("expType")}
                  style={S.input}
                  placeholder="Nhập loại chi…"
                />
              </FG>

              {/* fnCode1 */}
              <FG label="Mã chức năng 1" error={errors.fnCode1?.message}>
                <input
                  {...register("fnCode1")}
                  style={S.input}
                  placeholder="Nhập mã chức năng 1…"
                />
              </FG>

              {/* fnCode2 */}
              <FG label="Mã chức năng 2" error={errors.fnCode2?.message}>
                <input
                  {...register("fnCode2")}
                  style={S.input}
                  placeholder="Nhập mã chức năng 2…"
                />
              </FG>

              {/* fnAmount */}
              <FG label="Số tiền chức năng" error={errors.fnAmount?.message}>
                <Controller
                  name="fnAmount"
                  control={control}
                  render={({ field }) => (
                    <MoneyInput
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      currency={watchedCurrency || "VND"}
                    />
                  )}
                />
              </FG>

              {/* description — full width */}
              <FG
                label="Nội dung"
                required
                error={errors.description?.message}
                span3
              >
                <textarea
                  {...register("description")}
                  style={S.textarea}
                  placeholder="Nhập nội dung giao dịch…"
                  rows={3}
                />
              </FG>
            </div>
          </Tabs.Content>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 2: Khoản mục (Lines)                                          */}
          {/* ---------------------------------------------------------------- */}
          <Tabs.Content value="lines" style={{ padding: "14px" }}>
            {errors.lines?.root?.message && (
              <p style={{ ...S.errorMsg, marginBottom: "10px" }}>
                {errors.lines.root.message}
              </p>
            )}
            {typeof errors.lines?.message === "string" && (
              <p style={{ ...S.errorMsg, marginBottom: "10px" }}>
                {errors.lines.message}
              </p>
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  style={{
                    border: "1px solid #d7dbe0",
                    borderRadius: "4px",
                    background: "#fafcfe",
                    padding: "12px",
                  }}
                >
                  {/* Row header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#073763",
                      }}
                    >
                      Khoản mục #{index + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        style={S.btnDangerSm}
                      >
                        <Trash2
                          style={{ width: "13px", height: "13px" }}
                          aria-hidden="true"
                        />
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* lineAmount + lineDescription */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: "10px 18px",
                      marginBottom: "10px",
                    }}
                  >
                    <FG
                      label="Số tiền"
                      required
                      error={errors.lines?.[index]?.lineAmount?.message}
                    >
                      <Controller
                        name={`lines.${index}.lineAmount`}
                        control={control}
                        render={({ field: f }) => (
                          <MoneyInput
                            value={f.value}
                            onChange={(v) => f.onChange(v ?? 0)}
                            currency={watchedCurrency || "VND"}
                          />
                        )}
                      />
                    </FG>

                    <FG
                      label="Mô tả"
                      error={errors.lines?.[index]?.lineDescription?.message}
                    >
                      <input
                        {...register(`lines.${index}.lineDescription`)}
                        style={S.input}
                        placeholder="Mô tả khoản mục…"
                      />
                    </FG>
                  </div>

                  {/* CCID segments */}
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#5f6368",
                      textTransform: "uppercase",
                      letterSpacing: ".3px",
                      marginBottom: "8px",
                      marginTop: "2px",
                    }}
                  >
                    CCID Segments
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: "8px 14px",
                    }}
                  >
                    {CCID_KEYS.map((seg, si) => (
                      <FG
                        key={seg}
                        label={`Seg ${si + 1}`}
                        required
                        error={
                          (
                            errors.lines?.[index] as
                              | Record<string, { message?: string }>
                              | undefined
                          )?.[seg]?.message
                        }
                      >
                        <input
                          {...register(`lines.${index}.${seg}`)}
                          style={S.input}
                          placeholder={`Seg ${si + 1}…`}
                        />
                      </FG>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add line */}
            <button
              type="button"
              onClick={() => append(makeEmptyLine(fields.length + 1))}
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
                padding: "0 14px",
                fontSize: "12.5px",
                fontWeight: 600,
                borderRadius: "4px",
                border: "1px dashed #d7dbe0",
                background: "#fff",
                color: "#5f6368",
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <Plus
                style={{ width: "14px", height: "14px" }}
                aria-hidden="true"
              />
              Thêm khoản mục
            </button>

            {/* Total */}
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "6px",
                background: "#eef3f9",
                border: "1px solid #d7dbe0",
                borderRadius: "4px",
                padding: "8px 14px",
              }}
            >
              <span
                style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}
              >
                Tổng tiền:
              </span>
              <span
                style={{ fontSize: "13px", fontWeight: 700, color: "#0b5394" }}
              >
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </Tabs.Content>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 3: Người chuyển                                               */}
          {/* ---------------------------------------------------------------- */}
          <Tabs.Content value="sender" style={{ padding: "14px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "12px 18px",
              }}
            >
              <FG
                label="Tên người chuyển"
                required
                error={errors.senderName?.message}
              >
                <input
                  {...register("senderName")}
                  style={S.input}
                  placeholder="Nhập tên người chuyển…"
                />
              </FG>

              <FG
                label="Địa chỉ người chuyển"
                required
                error={errors.senderAddress?.message}
                span3
              >
                <input
                  {...register("senderAddress")}
                  style={S.input}
                  placeholder="Nhập địa chỉ…"
                />
              </FG>

              <FG
                label="GL Segment 2"
                required
                error={errors.senderGlSegment2?.message}
              >
                <input
                  {...register("senderGlSegment2")}
                  style={S.input}
                  placeholder="Nhập GL Segment 2…"
                />
              </FG>

              <FG label="Số tài khoản" error={errors.senderNum?.message}>
                <input
                  {...register("senderNum")}
                  style={S.input}
                  placeholder="Nhập số tài khoản…"
                />
              </FG>

              <FG
                label="Mã ngân hàng"
                required
                error={errors.senderBankCode?.message}
              >
                <input
                  {...register("senderBankCode")}
                  style={S.input}
                  placeholder="Nhập mã ngân hàng…"
                />
              </FG>

              <FG label="CMND/CCCD" error={errors.senderIdentifyId?.message}>
                <input
                  {...register("senderIdentifyId")}
                  style={S.input}
                  placeholder="Nhập số CMND/CCCD…"
                />
              </FG>

              <FG label="Ngày cấp" error={errors.senderIssuedDate?.message}>
                <Controller
                  name="senderIssuedDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? "")}
                    />
                  )}
                />
              </FG>

              <FG label="Nơi cấp" error={errors.senderIssuedPlace?.message}>
                <input
                  {...register("senderIssuedPlace")}
                  style={S.input}
                  placeholder="Nhập nơi cấp…"
                />
              </FG>

              <FG label="Mã TPCP" error={errors.tpcpCode?.message}>
                <input
                  {...register("tpcpCode")}
                  style={S.input}
                  placeholder="Nhập mã TPCP…"
                />
              </FG>
            </div>
          </Tabs.Content>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 4: Người nhận                                                 */}
          {/* ---------------------------------------------------------------- */}
          <Tabs.Content value="receiver" style={{ padding: "14px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "12px 18px",
              }}
            >
              <FG
                label="Tên người nhận"
                required
                error={errors.receiverName?.message}
              >
                <input
                  {...register("receiverName")}
                  style={S.input}
                  placeholder="Nhập tên người nhận…"
                />
              </FG>

              <FG
                label="Địa chỉ người nhận"
                error={errors.receiverAddress?.message}
                span3
              >
                <input
                  {...register("receiverAddress")}
                  style={S.input}
                  placeholder="Nhập địa chỉ…"
                />
              </FG>

              <FG
                label="GL Segment 2"
                required
                error={errors.receiverGlSegment2?.message}
              >
                <input
                  {...register("receiverGlSegment2")}
                  style={S.input}
                  placeholder="Nhập GL Segment 2…"
                />
              </FG>

              <FG
                label="Mã ngân hàng"
                required
                error={errors.receiverBankCode?.message}
              >
                <input
                  {...register("receiverBankCode")}
                  style={S.input}
                  placeholder="Nhập mã ngân hàng…"
                />
              </FG>

              <FG
                label="Tên tài khoản"
                required
                error={errors.receiverAccountName?.message}
              >
                <input
                  {...register("receiverAccountName")}
                  style={S.input}
                  placeholder="Nhập tên tài khoản…"
                />
              </FG>

              <FG label="CMND/CCCD" error={errors.receiverIdentifyId?.message}>
                <input
                  {...register("receiverIdentifyId")}
                  style={S.input}
                  placeholder="Nhập số CMND/CCCD…"
                />
              </FG>

              <FG label="Ngày cấp" error={errors.receiverIssuedDate?.message}>
                <Controller
                  name="receiverIssuedDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? "")}
                    />
                  )}
                />
              </FG>

              <FG label="Nơi cấp" error={errors.receiverIssuedPlace?.message}>
                <input
                  {...register("receiverIssuedPlace")}
                  style={S.input}
                  placeholder="Nhập nơi cấp…"
                />
              </FG>
            </div>
          </Tabs.Content>

          {/* ---------------------------------------------------------------- */}
          {/* Toolbar (bottom actions) — §5.3                                   */}
          {/* ---------------------------------------------------------------- */}
          <div
            style={{
              background: "#fafcfe",
              borderTop: "1px solid #d7dbe0",
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSaving}
              style={{
                ...S.btnDefault,
                opacity: isSaving ? 0.55 : 1,
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              Hủy
            </button>

            <div style={{ display: "flex", gap: "8px" }}>
              {/* Lưu nháp */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                style={{
                  ...S.btnGhost,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isSaving ? 0.55 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
              >
                {isSaving && <LoadingSpinner size="sm" />}
                Lưu nháp
              </button>

              {/* Lưu & Nộp */}
              <button
                type="button"
                onClick={() => void handleSubmit(onSaveAndSubmit)()}
                disabled={isSaving}
                style={{
                  ...S.btnPrimary,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isSaving ? 0.55 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
              >
                {isSaving && (
                  <LoadingSpinner size="sm" className="text-white" />
                )}
                Lưu &amp; Nộp
              </button>
            </div>
          </div>
        </Tabs.Root>
      </div>

      {/* Inline style for active tab trigger */}
      <style>{`
        .vdbas-tab-trigger[data-state=active] {
          border-bottom: 2px solid #0b5394 !important;
          color: #0b5394 !important;
          font-weight: 600 !important;
        }
        .vdbas-tab-trigger:hover {
          color: #0b5394 !important;
        }
      `}</style>
    </div>
  );
}
