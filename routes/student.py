from flask import Blueprint, jsonify, request
from flask_login import login_required
from datetime import datetime
from models.student import Student, db
from models.class_model import StudentClass

student_bp = Blueprint('student', __name__)

@student_bp.route('/students', methods=['GET'])
@login_required
def get_students():
    """Get all active students"""
    try:
        students = Student.query.filter_by(active=True).all()
        return jsonify([student.to_dict() for student in students])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/students', methods=['POST'])
@login_required
def create_student():
    """Create a new student"""
    try:
        data = request.json
        
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        # Parse birth_date if provided
        birth_date = None
        if data.get('birth_date'):
            try:
                birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid birth_date format. Use YYYY-MM-DD'}), 400
        
        student = Student(
            name=data['name'],
            birth_date=birth_date,
            phone=data.get('phone'),
            email=data.get('email'),
            address=data.get('address'),
            cord_level=data.get('cord_level'),
            guardian_name=data.get('guardian_name'),
            guardian_email=data.get('guardian_email'),
            guardian_phone=data.get('guardian_phone'),
            guardian_cpf=data.get('guardian_cpf'),
            guardian_address=data.get('guardian_address'),
            guardian_relationship=data.get('guardian_relationship')
        )
        
        db.session.add(student)
        db.session.commit()
        return jsonify(student.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/students/<int:student_id>', methods=['GET'])
@login_required
def get_student(student_id):
    """Get a specific student"""
    try:
        student = Student.query.get_or_404(student_id)
        return jsonify(student.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@student_bp.route('/students/<int:student_id>', methods=['PUT'])
@login_required
def update_student(student_id):
    """Update a student"""
    try:
        student = Student.query.get_or_404(student_id)
        data = request.json
        
        # Update basic fields
        student.name = data.get('name', student.name)
        student.phone = data.get('phone', student.phone)
        student.email = data.get('email', student.email)
        student.address = data.get('address', student.address)
        student.cord_level = data.get('cord_level', student.cord_level)
        
        # Update guardian fields
        student.guardian_name = data.get('guardian_name', student.guardian_name)
        student.guardian_email = data.get('guardian_email', student.guardian_email)
        student.guardian_phone = data.get('guardian_phone', student.guardian_phone)
        student.guardian_cpf = data.get('guardian_cpf', student.guardian_cpf)
        student.guardian_address = data.get('guardian_address', student.guardian_address)
        student.guardian_relationship = data.get('guardian_relationship', student.guardian_relationship)
        
        # Update birth_date if provided
        if 'birth_date' in data and data['birth_date']:
            try:
                student.birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid birth_date format. Use YYYY-MM-DD'}), 400
        
        db.session.commit()
        return jsonify(student.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/students/<int:student_id>', methods=['DELETE'])
@login_required
def delete_student(student_id):
    """Soft delete a student (mark as inactive)"""
    try:
        student = Student.query.get_or_404(student_id)
        student.active = False
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@student_bp.route('/students/<int:student_id>/classes', methods=['GET'])
@login_required
def get_student_classes(student_id):
    """Get all classes a student is enrolled in"""
    try:
        student = Student.query.get_or_404(student_id)
        student_classes = StudentClass.query.filter_by(student_id=student_id, active=True).all()
        
        classes_data = []
        for sc in student_classes:
            class_data = sc.class_obj.to_dict()
            class_data['enrollment_date'] = sc.enrollment_date.isoformat()
            classes_data.append(class_data)
        
        return jsonify(classes_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
