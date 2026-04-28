import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import paymentService from '../services/paymentService';

export default function PaymentResultPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [processed, setProcessed] = useState(false);

  // Parse MoMo response params from URL
  const searchParams = new URLSearchParams(search);
  const resultCode = searchParams.get('resultCode');
  const momoAmount = searchParams.get('amount');
  const amount = momoAmount ? Number(momoAmount).toLocaleString('vi-VN') : 0;
  const transactionId = searchParams.get('transId') || 'N/A';
  const payType = searchParams.get('payType') || 'N/A';
  const orderId = searchParams.get('orderId') || 'N/A';

  // MoMo: resultCode = 0 means success
  const isSuccess = resultCode === '0';

  useEffect(() => {
    if (!search || processed) return;

    const processPayment = async () => {
      try {
        await paymentService.momoCallback(search);
      } catch (error) {
        console.error('Backend payment processing error:', error);
      } finally {
        setProcessed(true);
      }
    };

    processPayment();
  }, [search, processed]);

  if (!resultCode) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 'calc(100vh - 150px)', background: '#f8fafc' }}>
        <div style={{ fontSize: '18px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTopColor: '#ae2070', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Đang xác thực kết quả giao dịch MoMo...
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)', margin: 0, padding: '20px' }}>
      <div style={{ background: '#ffffff', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', background: isSuccess ? '#d1fae5' : '#fee2e2', color: isSuccess ? '#10b981' : '#ef4444' }}>
          {isSuccess ? (
             <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          ) : (
             <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          )}
        </div>
        
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
          {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
        </div>
        <div style={{ fontSize: '15px', color: '#64748b', marginBottom: '25px', lineHeight: 1.5 }}>
          {isSuccess ? "Tuyệt vời, giao dịch của bạn đã được xác nhận qua MoMo. Hóa đơn đã được cập nhật trạng thái đã thanh toán." : "Rất tiếc, giao dịch MoMo của bạn không thể hoàn tất hoặc đã bị hủy. Vui lòng kiểm tra lại."}
        </div>
        
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '25px' }}>
          {amount} VNĐ
        </div>
        
        <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '20px', marginBottom: '30px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Mã giao dịch MoMo:</span>
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

        <button 
          onClick={() => navigate('/invoices')}
          style={{ width: '100%', padding: '14px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '16px', background: isSuccess ? '#10b981' : '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSuccess ? '0 4px 6px rgba(16, 185, 129, 0.2)' : '0 4px 6px rgba(239, 68, 68, 0.2)' }}
        >
          Trở về Quản lý Hóa đơn
        </button>
      </div>
    </div>
  );
}
