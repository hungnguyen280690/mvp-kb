// ============================================================================
// S02 — Man hinh lap LTT thu cong (Create/Edit/Clone/View modes)
// 4 field groups: Thong tin chung, Luoi COA, Nguoi chuyen, Nguoi nhan
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CoaGrid } from '@/components/payment/CoaGrid';
import { StatusBadge } from '@/components/payment/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  createPaymentOrder,
  updatePaymentOrder,
  getPaymentOrder,
  submitPaymentOrder,
} from '@/lib/api-client';
import { useAuth } from '@/auth';
import { useNotification } from '@/lib/notification-context';
import { paymentOrderFormSchema } from '@/lib/validation-rules';
import { createEmptyLineItem, calculateTotalAmount } from '@/lib/coa-validator';
import { getTodayDate, formatAmount } from '@/lib/utils';
import type { PaymentOrder, PaymentOrderCreateRequest, LineItem, SenderInfo, ReceiverInfo, FormMode } from '@/types';

interface FormData {
  requestNumber?: string;
  channel: string;
  orderType: string;
  transactionType?: string;
  receiverBankCode: string;
  paymentDate: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  originalDocNo?: string;
  originalDocDate?: string;
  feeType?: string;
  debitCurrency?: string;
  paymentCurrency?: string;
  foreignAmount?: number;
  paymentContent: string;
  lineItems: LineItem[];
  senderInfo: SenderInfo;
  receiverInfo: ReceiverInfo;
}

export function S02PaymentOrderForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { notify } = useNotification();

  // Determine mode
  const mode: FormMode = useMemo(() => {
    if (!id) return 'create';
    const editParam = searchParams.get('mode');
    if (editParam === 'edit') return 'edit';
    if (editParam === 'clone') return 'clone';
    return 'view';
  }, [id, searchParams]);

  const cloneFromId = searchParams.get('cloneFrom');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingData, setExistingData] = useState<PaymentOrder | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isReadOnly = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCloneMode = mode === 'clone' || !!cloneFromId;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(paymentOrderFormSchema),
    defaultValues: {
      channel: 'LNH',
      orderType: '',
      transactionType: '',
      receiverBankCode: '',
      paymentDate: getTodayDate(),
      amount: 0,
      currency: 'VND',
      exchangeRate: undefined,
      originalDocNo: '',
      originalDocDate: '',
      feeType: '',
      debitCurrency: '',
      paymentCurrency: '',
      foreignAmount: undefined,
      paymentContent: '',
      lineItems: [createEmptyLineItem()],
      senderInfo: {
        name: user?.userName || '',
        address: '',
        accountNumber: '',
        customerCode: '',
        bankCode: user?.bankCode || '',
        bankName: user?.bankName || '',
        identityDoc: '',
        identityDocIssueDate: '',
        identityDocIssuePlace: '',
        tpcpCode: '',
      },
      receiverInfo: {
        name: '',
        address: '',
        accountNumber: '',
        bankCode: '',
        bankName: '',
        accountName: '',
        identityDoc: '',
        identityDocIssueDate: '',
        identityDocIssuePlace: '',
      },
    },
  });

  const lineItems = watch('lineItems');
  const amount = watch('amount');
  const currency = watch('currency');
  const channel = watch('channel');

  // Calculate total from line items
  const calculatedTotal = useMemo(() => {
    return calculateTotalAmount(lineItems || []);
  }, [lineItems]);

  // Load existing data for edit/view/clone
  useEffect(() => {
    const loadId = id || cloneFromId;
    if (loadId) {
      setLoading(true);
      getPaymentOrder(loadId)
        .then(({ data }) => {
          setExistingData(data);

          if (isCloneMode) {
            // Clone: reset ID, version, request number
            reset({
              channel: data.channel,
              orderType: data.orderType,
              transactionType: data.transactionType || '',
              receiverBankCode: data.receiverBankCode,
              paymentDate: getTodayDate(),
              amount: data.amount,
              currency: data.currency,
              exchangeRate: data.exchangeRate || undefined,
              originalDocNo: data.originalDocNo || '',
              originalDocDate: data.originalDocDate || '',
              feeType: data.feeType || '',
              debitCurrency: data.debitCurrency || '',
              paymentCurrency: data.paymentCurrency || '',
              foreignAmount: data.foreignAmount || undefined,
              paymentContent: data.paymentContent,
              lineItems: data.lineItems.map((li) => ({ ...li, id: undefined })),
              senderInfo: data.senderInfo,
              receiverInfo: data.receiverInfo,
            });
          } else {
            reset({
              requestNumber: data.requestNumber,
              channel: data.channel,
              orderType: data.orderType,
              transactionType: data.transactionType || '',
              receiverBankCode: data.receiverBankCode,
              paymentDate: data.paymentDate,
              amount: data.amount,
              currency: data.currency,
              exchangeRate: data.exchangeRate || undefined,
              originalDocNo: data.originalDocNo || '',
              originalDocDate: data.originalDocDate || '',
              feeType: data.feeType || '',
              debitCurrency: data.debitCurrency || '',
              paymentCurrency: data.paymentCurrency || '',
              foreignAmount: data.foreignAmount || undefined,
              paymentContent: data.paymentContent,
              lineItems: data.lineItems,
              senderInfo: data.senderInfo,
              receiverInfo: data.receiverInfo,
            });
          }
        })
        .catch((error: unknown) => {
          const err = error as { message?: string };
          notify('error', err.message || 'Loi tai du lieu');
        })
        .finally(() => setLoading(false));
    }
  }, [id, cloneFromId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update amount when line items change
  useEffect(() => {
    if (!isReadOnly && calculatedTotal > 0) {
      setValue('amount', calculatedTotal);
    }
  }, [calculatedTotal, isReadOnly, setValue]);

  // Handle save draft
  const handleSaveDraft = useCallback(
    async (formData: FormData) => {
      setSaving(true);
      try {
        const request: PaymentOrderCreateRequest = {
          ...formData,
          requestNumber: formData.requestNumber || undefined,
        };

        if (isEditMode && existingData) {
          await updatePaymentOrder(existingData.id, request, existingData.version);
          notify('success', 'Luu nhap thanh cong');
        } else {
          await createPaymentOrder(request);
          notify('success', 'Tao LTT nhap thanh cong');
        }
        setIsDirty(false);
      } catch (error: unknown) {
        const err = error as { message?: string; isConflict?: boolean };
        if (err.isConflict) {
          notify('error', t('app.conflictMessage'));
        } else {
          notify('error', err.message || t('app.error'));
        }
      } finally {
        setSaving(false);
      }
    },
    [isEditMode, existingData, notify, t]
  );

  // Handle submit (gui kiem soat)
  const handleSubmitForApproval = useCallback(
    async (formData: FormData) => {
      setSaving(true);
      try {
        const request: PaymentOrderCreateRequest = { ...formData };

        let targetId: string;
        if (isEditMode && existingData) {
          await updatePaymentOrder(existingData.id, request, existingData.version);
          targetId = existingData.id;
        } else if (isCloneMode && cloneFromId) {
          // Clone creates a new LTT then submits
          const result = await createPaymentOrder(request);
          targetId = result.data.id;
        } else {
          const result = await createPaymentOrder(request);
          targetId = result.data.id;
        }

        await submitPaymentOrder(targetId);
        notify('success', 'Gui kiem soat thanh cong');
        setIsDirty(false);
        navigate('/');
      } catch (error: unknown) {
        const err = error as { message?: string; isConflict?: boolean; isValidationError?: boolean; violations?: unknown[] };
        if (err.isConflict) {
          notify('error', t('app.conflictMessage'));
        } else if (err.isValidationError && err.violations) {
          const messages = (err.violations as { message: string }[]).map((v) => v.message).join('; ');
          notify('error', messages);
        } else {
          notify('error', err.message || t('app.error'));
        }
      } finally {
        setSaving(false);
      }
    },
    [isEditMode, existingData, isCloneMode, cloneFromId, notify, navigate, t]
  );

  const handleExit = useCallback(() => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      navigate('/');
    }
  }, [isDirty, navigate]);

  const pageTitle = useMemo(() => {
    if (isReadOnly) return t('s02.titleView');
    if (isEditMode) return t('s02.titleEdit');
    if (isCloneMode) return t('s02.titleClone');
    return t('s02.titleCreate');
  }, [isReadOnly, isEditMode, isCloneMode, t]);

  if (loading) {
    return <LoadingSpinner size="lg" message={t('app.loading')} />;
  }

  const inputClass = (error?: { message?: string }) =>
    `w-full border rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 ${
      error ? 'border-danger-500 bg-danger-50' : 'border-gray-300'
    }`;

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{pageTitle}</h2>
        <div className="flex items-center gap-2">
          {existingData && <StatusBadge status={existingData.status} size="md" />}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSaveDraft)} className="space-y-6" data-testid="form-s02">
        {/* ================================================================
            Group 1: Thong tin chung
            ================================================================ */}
        <fieldset className="bg-white border border-gray-200 rounded-lg p-6" disabled={isReadOnly}>
          <legend className="text-lg font-medium text-gray-900 px-2">{t('s02.groups.general')}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* So YCTT */}
            <div>
              <label htmlFor="requestNumber" className={labelClass}>
                {t('s02.fields.requestNumber')}
              </label>
              <input
                id="requestNumber"
                type="text"
                {...register('requestNumber')}
                className={inputClass(errors.requestNumber)}
                readOnly={isEditMode}
                placeholder="De trong de tu sinh"
                data-testid="field-request-number"
              />
              {errors.requestNumber && <p className="mt-1 text-xs text-danger-500">{errors.requestNumber.message}</p>}
            </div>

            {/* Kenh */}
            <div>
              <label htmlFor="channel" className={labelClass}>{t('s02.fields.channel')} *</label>
              <select
                id="channel"
                {...register('channel')}
                className={inputClass(errors.channel)}
                data-testid="select-channel"
              >
                <option value="LNH">LNH - Lien ngan hang</option>
                <option value="SP">SP - Song phuong</option>
                <option value="LKB">LKB - Lien kho bac</option>
              </select>
              {errors.channel && <p className="mt-1 text-xs text-danger-500">{errors.channel.message}</p>}
            </div>

            {/* Loai lenh */}
            <div>
              <label htmlFor="orderType" className={labelClass}>{t('s02.fields.orderType')} *</label>
              <input
                id="orderType"
                type="text"
                {...register('orderType')}
                className={inputClass(errors.orderType)}
                data-testid="field-order-type"
              />
              {errors.orderType && <p className="mt-1 text-xs text-danger-500">{errors.orderType.message}</p>}
            </div>

            {/* NH/KB chuyen (autofill, read-only) */}
            <div>
              <label htmlFor="senderBankCode" className={labelClass}>{t('s02.fields.senderBankCode')}</label>
              <input
                id="senderBankCode"
                type="text"
                value={user?.bankCode || ''}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50"
                readOnly
                aria-readonly="true"
                data-testid="field-sender-bank-code"
              />
            </div>

            {/* NH/KB nhan */}
            <div>
              <label htmlFor="receiverBankCode" className={labelClass}>{t('s02.fields.receiverBankCode')} *</label>
              <input
                id="receiverBankCode"
                type="text"
                {...register('receiverBankCode')}
                className={inputClass(errors.receiverBankCode)}
                data-testid="field-receiver-bank-code"
              />
              {errors.receiverBankCode && <p className="mt-1 text-xs text-danger-500">{errors.receiverBankCode.message}</p>}
            </div>

            {/* Ngay thanh toan */}
            <div>
              <label htmlFor="paymentDate" className={labelClass}>{t('s02.fields.paymentDate')} *</label>
              <input
                id="paymentDate"
                type="date"
                {...register('paymentDate')}
                className={inputClass(errors.paymentDate)}
                data-testid="field-payment-date"
              />
              {errors.paymentDate && <p className="mt-1 text-xs text-danger-500">{errors.paymentDate.message}</p>}
            </div>

            {/* So tien chuyen */}
            <div>
              <label htmlFor="amount" className={labelClass}>{t('s02.fields.amount')} *</label>
              <input
                id="amount"
                type="number"
                {...register('amount', { valueAsNumber: true })}
                className={inputClass(errors.amount)}
                min="0"
                step="any"
                data-testid="field-amount"
              />
              {errors.amount && <p className="mt-1 text-xs text-danger-500">{errors.amount.message}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Tong khoan muc: {formatAmount(calculatedTotal)}
                {Math.abs(calculatedTotal - (amount || 0)) > 0.01 && (
                  <span className="text-danger-500 ml-1">(Khac tong LTT!)</span>
                )}
              </p>
            </div>

            {/* Loai tien */}
            <div>
              <label htmlFor="currency" className={labelClass}>{t('s02.fields.currency')} *</label>
              <select
                id="currency"
                {...register('currency')}
                className={inputClass(errors.currency)}
                data-testid="select-currency"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
              </select>
            </div>

            {/* Loai giao dich (chi LNH) */}
            {channel === 'LNH' && (
              <div>
                <label htmlFor="transactionType" className={labelClass}>{t('s02.fields.transactionType')}</label>
                <select
                  id="transactionType"
                  {...register('transactionType')}
                  className={inputClass(errors.transactionType)}
                  data-testid="field-transaction-type"
                >
                  <option value="">-- Chon --</option>
                  <option value="TX-INT">Noi bo</option>
                  <option value="TX-LCC">Lien ngan hang chuyen cung</option>
                  <option value="TX-LCT">Lien ngan hang chuyen thuong</option>
                </select>
              </div>
            )}

            {/* Ty gia (chi ngoai te) */}
            {currency !== 'VND' && (
              <div>
                <label htmlFor="exchangeRate" className={labelClass}>{t('s02.fields.exchangeRate')} *</label>
                <input
                  id="exchangeRate"
                  type="number"
                  {...register('exchangeRate', { valueAsNumber: true })}
                  className={inputClass(errors.exchangeRate)}
                  min="0"
                  step="any"
                  placeholder="Ty gia"
                  data-testid="field-exchange-rate"
                />
                {errors.exchangeRate && <p className="mt-1 text-xs text-danger-500">{errors.exchangeRate.message}</p>}
              </div>
            )}

            {/* So chung tu goc (chi SP) */}
            {channel === 'SP' && (
              <>
                <div>
                  <label htmlFor="originalDocNo" className={labelClass}>{t('s02.fields.originalDocNo')} *</label>
                  <input
                    id="originalDocNo"
                    type="text"
                    {...register('originalDocNo')}
                    className={inputClass(errors.originalDocNo)}
                  />
                </div>
                <div>
                  <label htmlFor="originalDocDate" className={labelClass}>{t('s02.fields.originalDocDate')}</label>
                  <input
                    id="originalDocDate"
                    type="date"
                    {...register('originalDocDate')}
                    className={inputClass(errors.originalDocDate)}
                  />
                </div>
              </>
            )}

            {/* Noi dung thanh toan */}
            <div className="md:col-span-2 lg:col-span-3">
              <label htmlFor="paymentContent" className={labelClass}>{t('s02.fields.paymentContent')} *</label>
              <textarea
                id="paymentContent"
                {...register('paymentContent')}
                className={inputClass(errors.paymentContent)}
                rows={3}
                maxLength={500}
                data-testid="field-payment-content"
              />
              {errors.paymentContent && <p className="mt-1 text-xs text-danger-500">{errors.paymentContent.message}</p>}
            </div>

            {/* Nguoi lap (autofill) */}
            <div>
              <label className={labelClass}>{t('s02.fields.makerName')}</label>
              <input
                type="text"
                value={user?.userName || ''}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50"
                readOnly
              />
            </div>

            {/* Ngay lap (autofill) */}
            <div>
              <label className={labelClass}>{t('s02.fields.createdAt')}</label>
              <input
                type="text"
                value={existingData?.createdAt ? new Date(existingData.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50"
                readOnly
              />
            </div>
          </div>
        </fieldset>

        {/* ================================================================
            Group 2: Luoi khoan muc COA
            ================================================================ */}
        <fieldset className="bg-white border border-gray-200 rounded-lg p-6" disabled={isReadOnly}>
          <legend className="text-lg font-medium text-gray-900 px-2">{t('s02.groups.lineItems')}</legend>
          <div className="mt-4">
            <Controller
              name="lineItems"
              control={control}
              render={({ field }) => (
                <CoaGrid
                  lineItems={field.value || []}
                  onChange={(items) => {
                    field.onChange(items);
                    setIsDirty(true);
                  }}
                  readOnly={isReadOnly}
                />
              )}
            />
            {errors.lineItems && (
              <p className="mt-2 text-xs text-danger-500">
                {typeof errors.lineItems.message === 'string' ? errors.lineItems.message : ''}
              </p>
            )}
          </div>
        </fieldset>

        {/* ================================================================
            Group 3: Thong tin nguoi chuyen
            ================================================================ */}
        <fieldset className="bg-white border border-gray-200 rounded-lg p-6" disabled={isReadOnly}>
          <legend className="text-lg font-medium text-gray-900 px-2">{t('s02.groups.sender')}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label htmlFor="senderName" className={labelClass}>{t('s02.fields.senderName')} *</label>
              <input id="senderName" type="text" {...register('senderInfo.name')} className={inputClass(errors.senderInfo?.name)} />
              {errors.senderInfo?.name && <p className="mt-1 text-xs text-danger-500">{errors.senderInfo.name.message}</p>}
            </div>
            <div>
              <label htmlFor="senderAddress" className={labelClass}>{t('s02.fields.senderAddress')} *</label>
              <input id="senderAddress" type="text" {...register('senderInfo.address')} className={inputClass(errors.senderInfo?.address)} />
            </div>
            <div>
              <label htmlFor="senderAccount" className={labelClass}>{t('s02.fields.senderAccount')} *</label>
              <input id="senderAccount" type="text" {...register('senderInfo.accountNumber')} className={inputClass(errors.senderInfo?.accountNumber)} data-testid="field-sender-account" />
            </div>
            <div>
              <label htmlFor="senderCustomerCode" className={labelClass}>{t('s02.fields.senderCustomerCode')}</label>
              <input id="senderCustomerCode" type="text" {...register('senderInfo.customerCode')} className={inputClass()} />
            </div>
            <div>
              <label htmlFor="senderBankCode" className={labelClass}>{t('s02.fields.senderBankCode')} *</label>
              <input id="senderBankCode" type="text" {...register('senderInfo.bankCode')} className={inputClass(errors.senderInfo?.bankCode)} />
            </div>
            <div>
              <label htmlFor="senderIdentityDoc" className={labelClass}>{t('s02.fields.senderIdentityDoc')}</label>
              <input id="senderIdentityDoc" type="text" {...register('senderInfo.identityDoc')} className={inputClass()} />
            </div>
            <div>
              <label htmlFor="senderIdentityDocDate" className={labelClass}>{t('s02.fields.senderIdentityDocDate')}</label>
              <input id="senderIdentityDocDate" type="date" {...register('senderInfo.identityDocIssueDate')} className={inputClass()} />
            </div>
            <div>
              <label htmlFor="senderIdentityDocPlace" className={labelClass}>{t('s02.fields.senderIdentityDocPlace')}</label>
              <input id="senderIdentityDocPlace" type="text" {...register('senderInfo.identityDocIssuePlace')} className={inputClass()} />
            </div>
            <div>
              <label htmlFor="senderTpcpCode" className={labelClass}>{t('s02.fields.senderTpcpCode')}</label>
              <input id="senderTpcpCode" type="text" {...register('senderInfo.tpcpCode')} className={inputClass()} />
            </div>
          </div>
        </fieldset>

        {/* ================================================================
            Group 4: Thong tin nguoi nhan
            ================================================================ */}
        <fieldset className="bg-white border border-gray-200 rounded-lg p-6" disabled={isReadOnly}>
          <legend className="text-lg font-medium text-gray-900 px-2">{t('s02.groups.receiver')}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label htmlFor="receiverName" className={labelClass}>{t('s02.fields.receiverName')} *</label>
              <input id="receiverName" type="text" {...register('receiverInfo.name')} className={inputClass(errors.receiverInfo?.name)} />
              {errors.receiverInfo?.name && <p className="mt-1 text-xs text-danger-500">{errors.receiverInfo.name.message}</p>}
            </div>
            <div>
              <label htmlFor="receiverAddress" className={labelClass}>{t('s02.fields.receiverAddress')}</label>
              <input id="receiverAddress" type="text" {...register('receiverInfo.address')} className={inputClass()} />
            </div>
            <div>
              <label htmlFor="receiverAccount" className={labelClass}>{t('s02.fields.receiverAccount')} *</label>
              <input id="receiverAccount" type="text" {...register('receiverInfo.accountNumber')} className={inputClass(errors.receiverInfo?.accountNumber)} />
            </div>
            <div>
              <label htmlFor="receiverBankCode" className={labelClass}>{t('s02.fields.receiverBankCode')} *</label>
              <input id="receiverBankCode" type="text" {...register('receiverInfo.bankCode')} className={inputClass(errors.receiverInfo?.bankCode)} />
            </div>
            <div>
              <label htmlFor="receiverAccountName" className={labelClass}>{t('s02.fields.receiverAccountName')} *</label>
              <input id="receiverAccountName" type="text" {...register('receiverInfo.accountName')} className={inputClass(errors.receiverInfo?.accountName)} />
            </div>
            <div>
              <label htmlFor="receiverIdentityDoc" className={labelClass}>{t('s02.fields.receiverIdentityDoc')}</label>
              <input id="receiverIdentityDoc" type="text" {...register('receiverInfo.identityDoc')} className={inputClass()} />
            </div>
            <div>
              <label htmlFor="receiverIdentityDocDate" className={labelClass}>{t('s02.fields.receiverIdentityDocDate')}</label>
              <input id="receiverIdentityDocDate" type="date" {...register('receiverInfo.identityDocIssueDate')} className={inputClass()} />
            </div>
            <div>
              <label htmlFor="receiverIdentityDocPlace" className={labelClass}>{t('s02.fields.receiverIdentityDocPlace')}</label>
              <input id="receiverIdentityDocPlace" type="text" {...register('receiverInfo.identityDocIssuePlace')} className={inputClass()} />
            </div>
          </div>
        </fieldset>

        {/* ================================================================
            Action buttons
            ================================================================ */}
        {!isReadOnly && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
            <div>
              <button
                type="button"
                onClick={handleExit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('s02.actions.exit')}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                data-testid="btn-save-draft"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? t('app.saving') : t('s02.actions.saveDraft')}
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                disabled={saving}
                data-testid="btn-submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {t('s02.actions.submit')}
              </button>
            </div>
          </div>
        )}

        {/* View mode: back button */}
        {isReadOnly && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t('app.back')}
            </button>
          </div>
        )}
      </form>

      {/* Exit confirmation dialog */}
      <ConfirmDialog
        isOpen={showExitConfirm}
        title={t('app.warning')}
        message={t('app.unsavedChanges')}
        variant="warning"
        confirmLabel={t('s02.actions.exit')}
        onConfirm={() => {
          setShowExitConfirm(false);
          navigate('/');
        }}
        onCancel={() => setShowExitConfirm(false)}
      />

      {/* Submit confirmation dialog */}
      <ConfirmDialog
        isOpen={showSubmitConfirm}
        title={t('s02.actions.submit')}
        message="Ban co chac chan muon gui kiem soat LTT nay? He thong se kiem tra day du quy tac VAL va BIZ."
        variant="info"
        confirmLabel={t('s02.actions.submit')}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          handleSubmit(handleSubmitForApproval)();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
}
