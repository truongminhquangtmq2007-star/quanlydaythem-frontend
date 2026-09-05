import React, { useState, useContext, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { toast } from 'react-toastify';

export const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank (Ngoại Thương VN)' },
  { code: 'MB', name: 'MBBank (Quân Đội)' },
  { code: 'TCB', name: 'Techcombank (Kỹ Thương)' },
  { code: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển VN)' },
  { code: 'ICB', name: 'VietinBank (Công Thương VN)' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)' },
  { code: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { code: 'HDB', name: 'HDBank (Phát Triển TP.HCM)' },
  { code: 'VBA', name: 'Agribank (Nông Nghiệp VN)' },
  { code: 'MSB', name: 'MSB (Hàng Hải)' },
  { code: 'OCB', name: 'OCB (Phương Đông)' },
  { code: 'VIB', name: 'VIB (Quốc Tế)' },
  { code: 'SHB', name: 'SHB (Sài Gòn - Hà Nội)' },
  { code: 'SSB', name: 'SeABank (Đông Nam Á)' },
  { code: 'LPB', name: 'LPBank (Lộc Phát VN)' }
];

const TeacherProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [bankCode, setBankCode] = useState('VCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axiosClient.get('/api/auth/me');
        if (res.data) {
          setFullName(res.data.full_name || '');
          setTitle(res.data.title || 'Thầy');
          setBankCode(res.data.bank_code || 'VCB');
          setAccountNumber(res.data.account_number || '');
          setAccountName(res.data.account_name || res.data.full_name || '');
        }
      } catch (e) {
        if (user) {
          setFullName(user.full_name || '');
          setTitle(user.title || 'Thầy');
          setBankCode((user as any).bank_code || 'VCB');
          setAccountNumber((user as any).account_number || '');
          setAccountName((user as any).account_name || user.full_name || '');
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedBank = VIETNAM_BANKS.find(b => b.code === bankCode);
      const res = await axiosClient.put('/api/auth/profile', { 
        full_name: fullName.trim(), 
        title,
        bank_code: bankCode.trim(),
        bank_name: selectedBank ? selectedBank.name : bankCode,
        account_number: accountNumber.trim(),
        account_name: accountName.trim().toUpperCase()
      });
      updateUser(res.data.user || { 
        full_name: fullName.trim(), 
        title,
        bank_code: bankCode.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim().toUpperCase()
      });
      toast.success('✓ Đã cập nhật hồ sơ và thông tin nhận học phí thành công!');
    } catch (err) {
      toast.error('Lỗi khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const isBankConfigured = Boolean(accountNumber && bankCode);

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ color: 'var(--color-text)', margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800' }}>Cài Đặt Tài Khoản Giáo Viên</h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>Cập nhật danh xưng, họ tên và thông tin tài khoản nhận học phí</p>
      </div>

      <Card style={{ padding: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <Avatar name={fullName || user?.full_name || 'GV'} size="lg" />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
              {title ? `${title} ` : ''}{fullName || user?.full_name || 'Giáo viên'}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
              <Badge variant="primary">{user?.role || 'TEACHER'}</Badge>
              <Badge variant={isBankConfigured ? 'success' : 'warning'}>
                {isBankConfigured ? '✓ Đã cấu hình VietQR' : '⚠️ Chưa cấu hình VietQR'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
      
      <Card style={{ padding: 'var(--spacing-6)' }}>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
          
          {/* SECTION 1: THÔNG TIN CÁ NHÂN */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--color-text)' }}>👤 Thông tin cơ bản</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <Select 
                  label="Danh xưng hiển thị"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  helperText="Sẽ hiển thị trước tên trên toàn bộ hệ thống (VD: Thầy Quang)"
                  options={[
                    { value: 'Thầy', label: 'Thầy' },
                    { value: 'Cô', label: 'Cô' },
                    { value: 'Mr', label: 'Mr' },
                    { value: 'Ms', label: 'Ms' },
                    { value: 'Gia sư', label: 'Gia sư' },
                    { value: 'Coach', label: 'Coach' }
                  ]}
                />
              </div>

              <div>
                <Input 
                  required
                  label="Họ và tên"
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  placeholder="Nhập họ tên của bạn..."
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />

          {/* SECTION 2: THÔNG TIN NHẬN HỌC PHÍ & MÃ QR */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text)' }}>💳 Thông tin nhận học phí (Mã QR)</h3>
              <Badge variant={isBankConfigured ? 'success' : 'warning'}>
                {isBankConfigured ? '✓ Đã cấu hình' : '⚠️ Chưa cấu hình'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <Select 
                  label="Ngân hàng nhận tiền"
                  value={bankCode} 
                  onChange={e => setBankCode(e.target.value)} 
                  options={VIETNAM_BANKS.map(b => ({ value: b.code, label: `${b.name} (${b.code})` }))}
                />
              </div>

              <div>
                <Input 
                  label="Số tài khoản ngân hàng"
                  value={accountNumber} 
                  onChange={e => setAccountNumber(e.target.value)} 
                  placeholder="Ví dụ: 0123456789"
                />
              </div>

              <div>
                <Input 
                  label="Tên chủ tài khoản (In hoa không dấu)"
                  value={accountName} 
                  onChange={e => setAccountName(e.target.value.toUpperCase())} 
                  placeholder="Ví dụ: NGUYEN VAN A"
                />
              </div>

              <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-background)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                💡 Thông tin này sẽ được tự động tạo thành mã QR chuẩn VietQR trên mọi phiếu học phí mà bạn gửi cho phụ huynh. Phụ huynh quét mã sẽ chuyển trực tiếp vào tài khoản này mà không bị khóa số tiền.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-2)' }}>
            <Button 
              type="submit" 
              variant="primary"
              isLoading={loading}
              disabled={loading}
              style={{ minHeight: '44px', minWidth: '140px' }}
            >
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TeacherProfile;
