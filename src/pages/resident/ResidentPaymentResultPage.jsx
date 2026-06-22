import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';

export default function ResidentPaymentResultPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [processed, setProcessed] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState(search ? 'processing' : 'idle');
  const [recordingError, setRecordingError] = useState('');

  const searchParams = new URLSearchParams(search);
  const isVnPay = searchParams.has('vnp_ResponseCode');
  const providerName = isVnPay ? 'VNPay' : 'MoMo';
  const resultCode = isVnPay ? searchParams.get('vnp_ResponseCode') : searchParams.get('resultCode');
  const transactionStatus = searchParams.get('vnp_TransactionStatus');
  const momoAmount = searchParams.get('amount');
  const vnPayAmount = searchParams.get('vnp_Amount');
  const rawAmount = isVnPay ? Number(vnPayAmount || 0) / 100 : Number(momoAmount || 0);
  const amount = rawAmount ? rawAmount.toLocaleString('vi-VN') : 0;
  const transactionId = isVnPay ? (searchParams.get('vnp_TransactionNo') || 'N/A') : (searchParams.get('transId') || 'N/A');
  const payType = isVnPay ? (searchParams.get('vnp_BankCode') || 'VNPay') : (searchParams.get('payType') || 'N/A');
  const orderId = isVnPay ? (searchParams.get('vnp_TxnRef') || 'N/A') : (searchParams.get('orderId') || 'N/A');

  const isSuccess = isVnPay ? resultCode === '00' && transactionStatus === '00' : resultCode === '0';
  const isRecording = isSuccess && recordingStatus === 'processing';
  const hasRecordingError = isSuccess && recordingStatus === 'failed';

  const processPayment = useCallback(async () => {
    if (!search) return;
    setRecordingStatus('processing');
    setRecordingError('');
    try {
      if (isVnPay) {
        await paymentService.vnPayCallback(search);
      } else {
        await paymentService.momoCallback(search);
      }
      setRecordingStatus('success');
    } catch (error) {
      console.error('Backend payment processing error:', error);
      setRecordingStatus('failed');
      setRecordingError(error.response?.data?.message || 'Hệ thống chưa ghi nhận được giao dịch. Vui lòng thử lại.');
    } finally {
      setProcessed(true);
    }
  }, [search, isVnPay]);

  useEffect(() => {
    if (!search || processed) return;
    processPayment();
  }, [search, processed, processPayment]);

  const title = isSuccess
    ? isRecording
      ? 'Đang ghi nhận thanh toán...'
      : hasRecordingError
        ? `${providerName} đã thanh toán, hệ thống chưa ghi nhận`
        : 'Thanh toán thành công!'
    : 'Thanh toán thất bại';

  const description = isSuccess
    ? isRecording
      ? `Giao dịch ${providerName} đã thành công. Hệ thống đang cập nhật trạng thái hóa đơn.`
      : hasRecordingError
        ? recordingError
        : `Giao dịch của bạn đã được xác nhận qua ${providerName}. Hóa đơn đã được cập nhật trạng thái đã thanh toán.`
    : `Rất tiếc, giao dịch ${providerName} của bạn không thể hoàn tất hoặc đã bị hủy. Vui lòng kiểm tra lại.`;

  if (!resultCode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ fontSize: '18px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTopColor: '#ae2070', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Đang xác thực kết quả giao dịch {providerName}...
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', margin: 0, padding: '20px' }}>
      <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', background: isSuccess && !hasRecordingError ? '#d1fae5' : '#fee2e2', color: isSuccess && !hasRecordingError ? '#10b981' : '#ef4444' }}>
          {isSuccess && !hasRecordingError ? (
             <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          ) : (
             <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          )}
        </div>
        
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
          {title}
        </div>
        <div style={{ fontSize: '15px', color: '#64748b', marginBottom: '25px', lineHeight: 1.5 }}>
          {description}
        </div>
        
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '25px' }}>
          {amount} VNĐ
        </div>
        
        <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '20px', marginBottom: '30px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Mã giao dịch {providerName}:</span>
            <span style={{ fontWeight: 600, color: '#334155' }}>{transactionId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Mã đơn hàng:</span>
            <span style={{ fontWeight: 600, color: '#334155' }}>{orderId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Phương thức:</span>
            <span style={{ fontWeight: 600, color: '#334155' }}>{payType}</span>
          </div>
        </div>

        {hasRecordingError && (
          <button
            onClick={() => setProcessed(false)}
            style={{ width: '100%', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', background: '#fff', color: '#ae2070', border: '1px solid #f0abcf', cursor: 'pointer', marginBottom: '12px' }}
          >
            Thử ghi nhận lại
          </button>
        )}

        <button 
          onClick={() => navigate('/resident/invoices')}
          style={{ width: '100%', padding: '14px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '16px', background: isSuccess ? '#10b981' : '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSuccess ? '0 4px 6px rgba(16, 185, 129, 0.2)' : '0 4px 6px rgba(239, 68, 68, 0.2)' }}
        >
          Trở về Hóa đơn
        </button>
      </div>
    </div>
  );
}
