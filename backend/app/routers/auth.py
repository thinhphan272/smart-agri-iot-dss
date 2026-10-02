from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
# Dùng Absolute Import để trình soạn thảo nhận diện chính xác và hết gạch đỏ
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import (
    UserRegisterRequest, 
    UserLoginRequest, 
    QuickDemoLoginRequest, 
    TokenResponse, 
    UserResponse
)
from backend.app.services.auth_service import hash_password, verify_password, create_access_token
from backend.app.dependencies import get_current_user
router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Đăng ký tài khoản mới:
    Kiểm tra trùng email -> Mã hóa mật khẩu Bcrypt -> Lưu vào bảng users
    """
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trong hệ thống!"
        )
    
    new_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        preferred_language=user_in.preferred_language,
        preferred_theme=user_in.preferred_theme,
        auth_provider="local"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user



@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Đăng nhập bằng Email & Mật khẩu:
    Kiểm tra hash Bcrypt -> Cấp phát JWT Access Token (hạn 24 giờ)
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not user.hashed_password or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name
    )



@router.post("/demo-login", response_model=TokenResponse)
def quick_demo_login(req: QuickDemoLoginRequest, db: Session = Depends(get_db)):
    """
    Đăng nhập nhanh 1-chạm (Dành riêng cho Hội đồng chấm đồ án):
    Chọn role ('admin', 'engineer', 'farmer') -> Tự động lấy tài khoản mẫu và cấp JWT Token
    """
    target_role = req.role.lower()
    user = db.query(User).filter(User.role == target_role).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tài khoản mẫu cho vai trò '{target_role}'!"
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Lấy thông tin tài khoản đang đăng nhập hiện tại:
    Yêu cầu gửi kèm Header 'Authorization: Bearer <token>'
    """
    return current_user

