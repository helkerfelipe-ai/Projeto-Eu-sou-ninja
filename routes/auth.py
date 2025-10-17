from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime, timedelta
from models.user import User, db
import re

auth_bp = Blueprint('auth', __name__)

# Simple rate limiting storage (in production, use Redis or similar)
login_attempts = {}

def is_rate_limited(ip_address):
    """Check if IP is rate limited for login attempts"""
    now = datetime.utcnow()
    if ip_address in login_attempts:
        attempts = login_attempts[ip_address]
        # Remove attempts older than 15 minutes
        attempts = [attempt for attempt in attempts if now - attempt < timedelta(minutes=15)]
        login_attempts[ip_address] = attempts
        
        # Check if more than 5 attempts in 15 minutes
        if len(attempts) >= 5:
            return True
    return False

def record_login_attempt(ip_address):
    """Record a failed login attempt"""
    now = datetime.utcnow()
    if ip_address not in login_attempts:
        login_attempts[ip_address] = []
    login_attempts[ip_address].append(now)

def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "A senha deve ter pelo menos 8 caracteres"
    
    if not re.search(r"[A-Za-z]", password):
        return False, "A senha deve conter pelo menos uma letra"
    
    if not re.search(r"\d", password):
        return False, "A senha deve conter pelo menos um número"
    
    return True, "Senha válida"

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and create session"""
    try:
        data = request.json
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        # Check rate limiting
        if is_rate_limited(client_ip):
            return jsonify({'error': 'Muitas tentativas de login. Tente novamente em 15 minutos.'}), 429
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Usuário e senha são obrigatórios'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Basic input validation
        if len(username) > 50 or len(password) > 100:
            return jsonify({'error': 'Dados de entrada inválidos'}), 400
        
        # Find user by username
        user = User.query.filter_by(username=username, active=True).first()
        
        if not user or not user.check_password(password):
            # Record failed attempt
            record_login_attempt(client_ip)
            return jsonify({'error': 'Usuário ou senha inválidos'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Log in user
        login_user(user, remember=True)
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logout user and clear session"""
    try:
        logout_user()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current authenticated user info"""
    try:
        return jsonify(current_user.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/check-session', methods=['GET'])
def check_session():
    """Check if user has valid session"""
    try:
        if current_user.is_authenticated:
            return jsonify({
                'authenticated': True,
                'user': current_user.to_dict()
            }), 200
        else:
            return jsonify({'authenticated': False}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (admin only in production)"""
    try:
        data = request.json
        
        if not data or not data.get('username') or not data.get('password') or not data.get('email'):
            return jsonify({'error': 'Username, password, and email are required'}), 400
        
        # Check if username already exists
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Check if email already exists
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'error': 'Email already exists'}), 400
        
        # Validate password strength
        is_valid, message = validate_password_strength(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            full_name=data.get('full_name'),
            role=data.get('role', 'user')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Change user password"""
    try:
        data = request.json
        
        if not data or not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        # Verify current password
        if not current_user.check_password(data['current_password']):
            return jsonify({'error': 'Senha atual incorreta'}), 400
        
        # Validate new password strength
        is_valid, message = validate_password_strength(data['new_password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if new password is different from current
        if current_user.check_password(data['new_password']):
            return jsonify({'error': 'A nova senha deve ser diferente da senha atual'}), 400
        
        # Update password
        current_user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Senha alterada com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
