from datetime import datetime
from models.user import db

class Attendance(db.Model):
    __tablename__ = 'attendances'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    present = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text, nullable=True)
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    student = db.relationship('Student', back_populates='attendances')
    class_obj = db.relationship('Class', back_populates='attendances')
    recorder = db.relationship('User', foreign_keys=[recorded_by])

    def __repr__(self):
        return f'<Attendance student_id={self.student_id} class_id={self.class_id} date={self.date}>'

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'class_id': self.class_id,
            'date': self.date.isoformat(),
            'present': self.present,
            'notes': self.notes,
            'recorded_by': self.recorded_by,
            'recorded_at': self.recorded_at.isoformat()
        }
