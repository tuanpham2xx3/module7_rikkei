import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { DoodleLoading } from '../ui/DoodleLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Chống nháy (Anti-flicker): Nếu đang kiểm tra phiên, luôn hiển thị màn hình tải
  if (isLoading) {
    return <DoodleLoading message="Đang kiểm tra phiên đăng nhập..." />;
  }

  // Nếu chưa đăng nhập, chuyển hướng mượt mà sang /login và lưu lại trang đang truy cập
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
