from flask import Blueprint, request, jsonify
from flask_login import login_required
from datetime import datetime, timedelta
from sqlalchemy import func, and_
from models.student import Student
from models.attendance import Attendance
from models.class_model import Class
from models.user import db

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports/frequency/<int:student_id>', methods=['GET'])
@login_required
def get_student_frequency(student_id):
    """Gera relatório de frequência individual do aluno"""
    try:
        # Parâmetros de data
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Se não especificado, usar últimos 30 dias
        if not start_date or not end_date:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Buscar aluno
        student = Student.query.get_or_404(student_id)
        
        # Buscar todas as presenças do período
        attendances = Attendance.query.filter(
            and_(
                Attendance.student_id == student_id,
                Attendance.date >= start_date,
                Attendance.date <= end_date
            )
        ).all()
        
        # Calcular estatísticas
        total_classes = len(attendances)
        present_count = sum(1 for att in attendances if att.present)
        absent_count = total_classes - present_count
        frequency_rate = (present_count / total_classes * 100) if total_classes > 0 else 0
        
        # Agrupar por mês para gráfico
        monthly_data = {}
        for attendance in attendances:
            month_key = attendance.date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {'present': 0, 'absent': 0, 'total': 0}
            
            monthly_data[month_key]['total'] += 1
            if attendance.present:
                monthly_data[month_key]['present'] += 1
            else:
                monthly_data[month_key]['absent'] += 1
        
        # Converter para lista ordenada
        monthly_chart = []
        for month, data in sorted(monthly_data.items()):
            monthly_chart.append({
                'month': month,
                'present': data['present'],
                'absent': data['absent'],
                'total': data['total'],
                'frequency_rate': (data['present'] / data['total'] * 100) if data['total'] > 0 else 0
            })
        
        return jsonify({
            'student': student.to_dict(),
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'summary': {
                'total_classes': total_classes,
                'present_count': present_count,
                'absent_count': absent_count,
                'frequency_rate': round(frequency_rate, 2)
            },
            'monthly_data': monthly_chart,
            'attendances': [att.to_dict() for att in attendances]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/class-frequency/<int:class_id>', methods=['GET'])
@login_required
def get_class_frequency(class_id):
    """Gera relatório de frequência por turma"""
    try:
        # Parâmetros de data
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Buscar turma
        class_obj = Class.query.get_or_404(class_id)
        
        # Buscar todas as presenças da turma no período
        attendances = db.session.query(Attendance, Student).join(Student).filter(
            and_(
                Attendance.class_id == class_id,
                Attendance.date >= start_date,
                Attendance.date <= end_date
            )
        ).all()
        
        # Agrupar por aluno
        student_stats = {}
        for attendance, student in attendances:
            if student.id not in student_stats:
                student_stats[student.id] = {
                    'student': student.to_dict(),
                    'present': 0,
                    'absent': 0,
                    'total': 0
                }
            
            student_stats[student.id]['total'] += 1
            if attendance.present:
                student_stats[student.id]['present'] += 1
            else:
                student_stats[student.id]['absent'] += 1
        
        # Calcular taxa de frequência para cada aluno
        for student_id, stats in student_stats.items():
            stats['frequency_rate'] = (stats['present'] / stats['total'] * 100) if stats['total'] > 0 else 0
        
        # Estatísticas gerais da turma
        total_attendances = len(attendances)
        total_present = sum(1 for att, _ in attendances if att.present)
        class_frequency_rate = (total_present / total_attendances * 100) if total_attendances > 0 else 0
        
        return jsonify({
            'class': class_obj.to_dict(),
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'class_summary': {
                'total_attendances': total_attendances,
                'total_present': total_present,
                'total_absent': total_attendances - total_present,
                'frequency_rate': round(class_frequency_rate, 2)
            },
            'students': list(student_stats.values())
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/general-stats', methods=['GET'])
@login_required
def get_general_stats():
    """Estatísticas gerais do sistema"""
    try:
        # Parâmetros de data
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Estatísticas básicas
        total_students = Student.query.filter_by(active=True).count()
        total_classes = Class.query.filter_by(active=True).count()
        
        # Estatísticas de frequência no período
        total_attendances = Attendance.query.filter(
            and_(
                Attendance.date >= start_date,
                Attendance.date <= end_date
            )
        ).count()
        
        total_present = Attendance.query.filter(
            and_(
                Attendance.date >= start_date,
                Attendance.date <= end_date,
                Attendance.present == True
            )
        ).count()
        
        overall_frequency = (total_present / total_attendances * 100) if total_attendances > 0 else 0
        
        # Alunos menores de idade
        minors_count = 0
        for student in Student.query.filter_by(active=True).all():
            if student.is_minor():
                minors_count += 1
        
        # Distribuição por nível de corda
        cord_distribution = db.session.query(
            Student.cord_level,
            func.count(Student.id).label('count')
        ).filter_by(active=True).group_by(Student.cord_level).all()
        
        cord_stats = [{'level': level or 'Não informado', 'count': count} for level, count in cord_distribution]
        
        return jsonify({
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'general_stats': {
                'total_students': total_students,
                'total_classes': total_classes,
                'minors_count': minors_count,
                'adults_count': total_students - minors_count
            },
            'frequency_stats': {
                'total_attendances': total_attendances,
                'total_present': total_present,
                'total_absent': total_attendances - total_present,
                'overall_frequency': round(overall_frequency, 2)
            },
            'cord_distribution': cord_stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
