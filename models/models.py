from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from models.conn import db
from sqlalchemy import ForeignKey, inspect
from sqlalchemy.sql import or_

#from app import db # commented beause of circula import

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)

    def __repr__(self):
        return f'<Role {self.name}>'    
    
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'))
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))  # Campo per la password criptata

    # Relazione many-to-many tra User e Role
    roles = db.relationship('Role', secondary=user_roles, backref=db.backref('users', lazy='dynamic'))

    def __str__(self):
        return f'{self.id}'
    
    def __repr__(self):
        out = f'User(id={self.id}, username={self.username}, email={self.email})'
        return out
    
    def set_password(self, password):
        """Imposta la password criptata."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica se la password è corretta."""
        return check_password_hash(self.password_hash, password)    
    
    def has_role(self, role_name):
        return any(role.name == role_name for role in self.roles)
    
class Track(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    local_name = db.Column(db.String(32), nullable=False)
    ts_add = db.Column( db.Float(), default=datetime.now().timestamp() )
    user_id = db.Column(db.Integer() , db.ForeignKey('user.id'))

    # Relazione tra User e Post
    user = db.relationship('User', backref=db.backref('posts', lazy=True))    

    def __str__(self):
        return f'{self.id}'
        
class Section(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ts_add = db.Column( db.Float(), default=datetime.now().timestamp() )
    start = db.Column( db.Integer() )
    end = db.Column( db.Integer() )
    track_id = db.Column(db.String(16), ForeignKey('track.id'))

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ts_add = db.Column( db.Float(), default=datetime.now().timestamp() )
    text = db.Column(db.String(1000) )
    track_id = db.Column(db.String(16), ForeignKey('track.id'))
    section_id = db.Column(db.String(16), ForeignKey('section.id'))

    
def init_db():  #vecchio stile
    # Verifica se i ruoli esistono già
    if not Role.query.filter_by(name='admin').first():  #and Role.query... user
        admin_role = Role(name='admin')
        user_role = Role(name='user')
        
        db.session.add(admin_role)
        db.session.add(user_role)
        db.session.commit()

    # Verifica se l'utente admin esiste già
    if not User.query.filter_by(username='admin').first():
        admin_user = User(username="admin", email="admin@example.com")
        admin_user.set_password("adminpassword")
        admin_user.roles.append(Role.query.filter_by(name='admin').first())
        
        db.session.add(admin_user)
        db.session.commit()    
        
