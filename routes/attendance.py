from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from models.attendance import Attendance, db
from models.student import Student
from models.class_model import Class

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/attendances', methods=['GET'])
@login_required
def get_attendances():
    """Get attendances with optional filters"""
    try:
        # Get query parameters
        student_id = request.args.get('student_id', type=int)
        class_id = request.args.get('class_id', type=int)
        date = request.args.get('date')
        
        # Build query
        query = Attendance.query
        
        if student_id:
            query = query.filter_by(student_id=student_id)
        
        if class_id:
            query = query.filter_by(class_id=class_id)
        
        if date:
            try:
                attendance_date = datetime.strptime(date, '%Y-%m-%d').date()
                query = query.filter_by(date=attendance_date)
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        attendances = query.all()
        return jsonify([attendance.to_dict() for attendance in attendances])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/attendances', methods=['POST'])
@login_required
def create_attendance():
    """Create a single attendance record"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['student_id', 'class_id', 'date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse date
        try:
            attendance_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Check if student and class exist
        student = Student.query.get(data['student_id'])
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        class_obj = Class.query.get(data['class_id'])
        if not class_obj:
            return jsonify({'error': 'Class not found'}), 404
        
        # Check if attendance already exists
        existing = Attendance.query.filter_by(
            student_id=data['student_id'],
            class_id=data['class_id'],
            date=attendance_date
        ).first()
        
        if existing:
            return jsonify({'error': 'Attendance record already exists for this student, class, and date'}), 400
        
        # Create attendance record
        attendance = Attendance(
            student_id=data['student_id'],
            class_id=data['class_id'],
            date=attendance_date,
            present=data.get('present', True),
            notes=data.get('notes'),
            recorded_by=current_user.id
        )
        
        db.session.add(attendance)
        db.session.commit()
        
        return jsonify(attendance.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/attendances/bulk', methods=['POST'])
@login_required
def create_bulk_attendance():
    """Create multiple attendance records at once"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['class_id', 'date', 'attendances']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse date
        try:
            attendance_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Check if class exists
        class_obj = Class.query.get(data['class_id'])
        if not class_obj:
            return jsonify({'error': 'Class not found'}), 404
        
        created_records = []
        errors = []
        
        for attendance_data in data['attendances']:
            try:
                student_id = attendance_data['student_id']
                
                # Check if student exists
                student = Student.query.get(student_id)
                if not student:
                    errors.append(f'Student {student_id} not found')
                    continue
                
                # Check if attendance already exists
                existing = Attendance.query.filter_by(
                    student_id=student_id,
                    class_id=data['class_id'],
                    date=attendance_date
                ).first()
                
                if existing:
                    # Update existing record
                    existing.present = attendance_data.get('present', True)
                    existing.notes = attendance_data.get('notes')
                    existing.recorded_by = current_user.id
                    existing.recorded_at = datetime.utcnow()
                    created_records.append(existing.to_dict())
                else:
                    # Create new record
                    attendance = Attendance(
                        student_id=student_id,
                        class_id=data['class_id'],
                        date=attendance_date,
                        present=attendance_data.get('present', True),
                        notes=attendance_data.get('notes'),
                        recorded_by=current_user.id
                    )
                    db.session.add(attendance)
                    created_records.append(attendance.to_dict())
                
            except Exception as e:
                errors.append(f'Error processing student {attendance_data.get("student_id", "unknown")}: {str(e)}')
        
        db.session.commit()
        
        return jsonify({
            'message': f'Processed {len(created_records)} attendance records',
            'created': created_records,
            'errors': errors
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/attendances/<int:attendance_id>', methods=['GET'])
@login_required
def get_attendance(attendance_id):
    """Get a specific attendance record"""
    try:
        attendance = Attendance.query.get_or_404(attendance_id)
        return jsonify(attendance.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/attendances/<int:attendance_id>', methods=['PUT'])
@login_required
def update_attendance(attendance_id):
    """Update an attendance record"""
    try:
        attendance = Attendance.query.get_or_404(attendance_id)
        data = request.json
        
        # Update fields
        if 'present' in data:
            attendance.present = data['present']
        
        if 'notes' in data:
            attendance.notes = data['notes']
        
        # Update recorded_by and recorded_at
        attendance.recorded_by = current_user.id
        attendance.recorded_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify(attendance.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/attendances/<int:attendance_id>', methods=['DELETE'])
@login_required
def delete_attendance(attendance_id):
    """Delete an attendance record"""
    try:
        attendance = Attendance.query.get_or_404(attendance_id)
        db.session.delete(attendance)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
