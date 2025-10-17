import os
from flask import Flask, send_from_directory, jsonify
from flask_login import LoginManager
from flask_cors import CORS
from models.user import db, User
from routes.user import user_bp
from routes.student import student_bp
from routes.class_routes import class_bp
from routes.attendance import attendance_bp
from routes.auth import auth_bp
from routes.reports import reports_bp

# Import all models to ensure they are registered with SQLAlchemy
from models.student import Student
from models.class_model import Class, StudentClass
from models.attendance import Attendance

app = Flask(__name__, static_folder='static')

# Enable CORS for all routes
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'capoeira_system_secret_key_2024_secure_random_key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Flask-Login configuration
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'
login_manager.login_message_category = 'info'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(student_bp, url_prefix='/api')
app.register_blueprint(class_bp, url_prefix='/api')
app.register_blueprint(attendance_bp, url_prefix='/api')
app.register_blueprint(reports_bp, url_prefix='/api')

# Initialize database
db.init_app(app)

def create_default_admin():
    """Create default admin user if no users exist"""
    with app.app_context():
        if User.query.count() == 0:
            admin = User(
                username='admin',
                email='admin@capoeira.com',
                full_name='Administrador',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created: username='admin', password='admin123'")

# Create tables and default admin
with app.app_context():
    db.create_all()
    create_default_admin()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve static files and SPA routing"""
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return jsonify({"error": "Static folder not configured"}), 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return jsonify({"error": "index.html not found"}), 404

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
