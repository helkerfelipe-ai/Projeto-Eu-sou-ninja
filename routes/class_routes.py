from flask import Blueprint, jsonify, request
from flask_login import login_required
from datetime import datetime, time
from models.class_model import Class, StudentClass, db
from models.student import Student
from models.attendance import Attendance

class_bp = Blueprint('class', __name__)

@class_bp.route('/classes', methods=['GET'])
@login_required
def get_classes():
    """Get all active classes"""
    try:
        classes = Class.query.filter_by(active=True).all()
        return jsonify([class_obj.to_dict() for class_obj in classes])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@class_bp.route('/classes', methods=['POST'])
@login_required
def create_class():
    """Create a new class"""
    try:
        data = request.json
        
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        # Parse time fields
        try:
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except (ValueError, KeyError):
            return jsonify({'error': 'Invalid time format. Use HH:MM'}), 400
        
        # Validate day_of_week
        day_of_week = data.get('day_of_week')
        if day_of_week is None or not (0 <= day_of_week <= 6):
            return jsonify({'error': 'day_of_week must be between 0 (Monday) and 6 (Sunday)'}), 400
        
        # Validate time order
        if start_time >= end_time:
            return jsonify({'error': 'Start time must be before end time'}), 400
        
        class_obj = Class(
            name=data['name'],
            description=data.get('description'),
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            instructor=data.get('instructor'),
            location=data.get('location'),
            max_students=data.get('max_students')
        )
        
        db.session.add(class_obj)
        db.session.commit()
        return jsonify(class_obj.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@class_bp.route('/classes/<int:class_id>', methods=['GET'])
@login_required
def get_class(class_id):
    """Get a specific class"""
    try:
        class_obj = Class.query.get_or_404(class_id)
        return jsonify(class_obj.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@class_bp.route('/classes/<int:class_id>', methods=['PUT'])
@login_required
def update_class(class_id):
    """Update a class"""
    try:
        class_obj = Class.query.get_or_404(class_id)
        data = request.json
        
        class_obj.name = data.get('name', class_obj.name)
        class_obj.description = data.get('description', class_obj.description)
        class_obj.instructor = data.get('instructor', class_obj.instructor)
        class_obj.location = data.get('location', class_obj.location)
        class_obj.max_students = data.get('max_students', class_obj.max_students)
        
        # Update day_of_week if provided
        if 'day_of_week' in data:
            day_of_week = data['day_of_week']
            if not (0 <= day_of_week <= 6):
                return jsonify({'error': 'day_of_week must be between 0 (Monday) and 6 (Sunday)'}), 400
            class_obj.day_of_week = day_of_week
        
        # Update times if provided
        if 'start_time' in data:
            try:
                start_time = datetime.strptime(data['start_time'], '%H:%M').time()
                class_obj.start_time = start_time
            except ValueError:
                return jsonify({'error': 'Invalid start_time format. Use HH:MM'}), 400
        
        if 'end_time' in data:
            try:
                end_time = datetime.strptime(data['end_time'], '%H:%M').time()
                class_obj.end_time = end_time
            except ValueError:
                return jsonify({'error': 'Invalid end_time format. Use HH:MM'}), 400
        
        # Validate time order if both times are being updated
        if class_obj.start_time >= class_obj.end_time:
            return jsonify({'error': 'Start time must be before end time'}), 400
        
        db.session.commit()
        return jsonify(class_obj.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@class_bp.route('/classes/<int:class_id>', methods=['DELETE'])
@login_required
def delete_class(class_id):
    """Soft delete a class (mark as inactive)"""
    try:
        class_obj = Class.query.get_or_404(class_id)
        class_obj.active = False
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@class_bp.route('/classes/<int:class_id>/students', methods=['GET'])
@login_required
def get_class_students(class_id):
    """Get all students enrolled in a specific class"""
    try:
        class_obj = Class.query.get_or_404(class_id)
        student_classes = StudentClass.query.filter_by(class_id=class_id, active=True).all()
        
        students_data = []
        for sc in student_classes:
            student_data = sc.student.to_dict()
            student_data['enrollment_date'] = sc.enrollment_date.isoformat()
            students_data.append(student_data)
        
        return jsonify(students_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@class_bp.route('/classes/<int:class_id>/students/<int:student_id>', methods=['POST'])
@login_required
def add_student_to_class(class_id, student_id):
    """Add a student to a class"""
    try:
        # Check if student and class exist
        class_obj = Class.query.get_or_404(class_id)
        student = Student.query.get_or_404(student_id)
        
        # Check if already enrolled
        existing = StudentClass.query.filter_by(student_id=student_id, class_id=class_id, active=True).first()
        if existing:
            return jsonify({'error': 'Student already enrolled in this class'}), 400
        
        # Check max_students limit
        if class_obj.max_students:
            current_count = StudentClass.query.filter_by(class_id=class_id, active=True).count()
            if current_count >= class_obj.max_students:
                return jsonify({'error': 'Class is full'}), 400
        
        # Create enrollment
        enrollment = StudentClass(student_id=student_id, class_id=class_id)
        db.session.add(enrollment)
        db.session.commit()
        
        return jsonify(enrollment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@class_bp.route('/classes/<int:class_id>/students/<int:student_id>', methods=['DELETE'])
@login_required
def remove_student_from_class(class_id, student_id):
    """Remove a student from a class"""
    try:
        enrollment = StudentClass.query.filter_by(student_id=student_id, class_id=class_id, active=True).first_or_404()
        enrollment.active = False
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@class_bp.route('/classes/<int:class_id>/attendance/<date>', methods=['GET'])
@login_required
def get_class_attendance(class_id, date):
    """Get attendance for a specific class and date"""
    try:
        # Validate date format
        try:
            attendance_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Get all students enrolled in the class
        student_classes = StudentClass.query.filter_by(class_id=class_id, active=True).all()
        
        students_with_attendance = []
        for sc in student_classes:
            student_data = sc.student.to_dict()
            
            # Get attendance record for this student, class, and date
            attendance = Attendance.query.filter_by(
                student_id=sc.student_id,
                class_id=class_id,
                date=attendance_date
            ).first()
            
            if attendance:
                student_data['attendance'] = attendance.to_dict()
            else:
                student_data['attendance'] = None
            
            students_with_attendance.append(student_data)
        
        return jsonify(students_with_attendance)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
