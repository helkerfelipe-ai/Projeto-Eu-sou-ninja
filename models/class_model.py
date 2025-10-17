from datetime import datetime, time
from models.user import db

class Class(db.Model):
    __tablename__ = 'classes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Segunda, 1=Terça, ..., 6=Domingo
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    instructor = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    max_students = db.Column(db.Integer, nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com alunos (many-to-many)
    students = db.relationship('StudentClass', back_populates='class_obj', cascade='all, delete-orphan')
    
    # Relacionamento com presenças
    attendances = db.relationship('Attendance', back_populates='class_obj', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Class {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'instructor': self.instructor,
            'location': self.location,
            'max_students': self.max_students,
            'active': self.active,
            'created_date': self.created_date.isoformat()
        }

# Tabela de associação many-to-many entre Student e Class
class StudentClass(db.Model):
    __tablename__ = 'student_classes'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)
    
    # Relacionamentos
    student = db.relationship('Student', back_populates='classes')
    class_obj = db.relationship('Class', back_populates='students')

    def __repr__(self):
        return f'<StudentClass student_id={self.student_id} class_id={self.class_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'class_id': self.class_id,
            'enrollment_date': self.enrollment_date.isoformat(),
            'active': self.active
        }
