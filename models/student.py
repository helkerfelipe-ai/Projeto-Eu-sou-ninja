from datetime import datetime, date
from models.user import db

class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.Date, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.Text, nullable=True)
    cord_level = db.Column(db.String(50), nullable=True)  # Nível da corda (iniciante, amarela, etc.)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)
    
    # Campos para responsável legal (quando menor de idade)
    guardian_name = db.Column(db.String(100), nullable=True)
    guardian_email = db.Column(db.String(120), nullable=True)
    guardian_phone = db.Column(db.String(20), nullable=True)
    guardian_cpf = db.Column(db.String(14), nullable=True)
    guardian_address = db.Column(db.Text, nullable=True)
    guardian_relationship = db.Column(db.String(50), nullable=True)  # pai, mãe, avô, etc.
    
    # Relacionamento com turmas (many-to-many)
    classes = db.relationship('StudentClass', back_populates='student', cascade='all, delete-orphan')
    
    # Relacionamento com presenças
    attendances = db.relationship('Attendance', back_populates='student', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Student {self.name}>'

    def is_minor(self):
        """Verifica se o aluno é menor de idade"""
        if not self.birth_date:
            return False
        today = date.today()
        age = today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        return age < 18

    def get_age(self):
        """Calcula a idade do aluno"""
        if not self.birth_date:
            return None
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'age': self.get_age(),
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'cord_level': self.cord_level,
            'registration_date': self.registration_date.isoformat(),
            'active': self.active,
            'is_minor': self.is_minor(),
            'guardian_name': self.guardian_name,
            'guardian_email': self.guardian_email,
            'guardian_phone': self.guardian_phone,
            'guardian_cpf': self.guardian_cpf,
            'guardian_address': self.guardian_address,
            'guardian_relationship': self.guardian_relationship
        }
