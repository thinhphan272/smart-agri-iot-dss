from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .services.auth_service import decode_access_token


# Khai báo chuẩn HTTPBearer cho Swagger UI (hiện ô Value dán token trực tiếp)
security = HTTPBearer(auto_error=False)


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security), 
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency kiểm tra JWT Token của người gửi request.
    Nếu không có token hoặc token giả mạo/hết hạn -> Báo lỗi 401 Unauthorized.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not auth or not auth.credentials:
        raise credentials_exception
    token = auth.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(allowed_roles: List[str]):
    """
    Decorator kiểm tra phân quyền RBAC:
    Chỉ cho phép những tài khoản có vai trò nằm trong danh sách `allowed_roles` truy cập.
    Ví dụ: require_role(["admin", "engineer"])
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Quyền truy cập bị từ chối! Chức năng này yêu cầu quyền: {', '.join(allowed_roles)} (Vai trò hiện tại của bạn: {current_user.role})"
            )
        return current_user
    return role_checker




















