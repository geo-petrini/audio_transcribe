import os
import secrets
from datetime import datetime
import json
from flask_login import UserMixin
from flask import jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.conn import db
from sqlalchemy import ForeignKey, inspect
from sqlalchemy.sql import or_

#from app import db # commented beause of circula import

class Timestamped():
    ts_format = '%Y-%m-%d %H:%M:%S'
    ts_add = db.Column( db.Float(), default=datetime.now().timestamp() )

    @property
    def formatted_ts_add(self):
        return datetime.fromtimestamp(self.ts_add).strftime(self.ts_format)

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
    roles = db.relationship('Role', secondary=user_roles, backref=db.backref('users', lazy='joined')) #TODO chk se lazy='dynamic' funziona

    def __str__(self):
        return f'{self.id}'
    
    def __repr__(self):
        out = f'User(id={self.id}, username={self.username}, email={self.email})'
        return out
    
    def to_dict(self):
        out = {
            'username' : self.username,
            'email' : self.email
        }
        return out        
    
    def set_password(self, password):
        """Imposta la password criptata."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica se la password è corretta."""
        return check_password_hash(self.password_hash, password)    
    
    def has_role(self, role_name):
        return any(role.name == role_name for role in self.roles)
    
class Track(db.Model, Timestamped):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    local_name = db.Column(db.String(32), nullable=False)
    user_id = db.Column(db.Integer() , ForeignKey('user.id'))

    # Relazione tra User e Post
    user = db.relationship('User', backref=db.backref('track_user', lazy='joined'))    
    regions = db.relationship('Region', backref=db.backref('track_regions', lazy='joined'))   


    def __str__(self):
        return f'Track (id:{self.id}, name:"{self.name}")'
    def __repr__(self):
        return f'Track (id:{self.id}, name:"{self.name}")'
    
        
class Region(db.Model, Timestamped):
    id = db.Column(db.Integer, primary_key=True)
    native_id = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(255))
    start = db.Column( db.Integer() )
    end = db.Column( db.Integer() )
    track_id = db.Column(db.String(16), ForeignKey('track.id'))
    user_id = db.Column(db.Integer() , ForeignKey('user.id'))

    user = db.relationship('User', backref=db.backref('region_user', lazy='joined'))   
    comments = db.relationship('Comment', backref=db.backref('region_comments', lazy='joined'))   #TODO chk se lazy='joined' funziona
    
    def to_json(self):
        return json.dumps( self.to_dict() )
    
    def to_dict(self):
        out = {
            'id' : self.id,
            'native_id' : self.native_id,
            'title' : self.title,
            'start' : self.start,
            'end' : self.end,
            'ts': self.ts_add
        }
        return out        
        

class Comment(db.Model, Timestamped):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(1000) )
    track_id = db.Column(db.String(16), ForeignKey('track.id'))
    region_id = db.Column(db.String(16), ForeignKey('region.id'))
    user_id = db.Column(db.Integer() , ForeignKey('user.id'))
    
    user = db.relationship('User', backref=db.backref('user_comments', lazy='joined'))   
    
    def to_json(self):
        return json.dumps( self.to_dict() )
    
    def to_dict(self):
        out = {
            'id' : self.id,
            'text' : self.text,
            'track_id' : self.track_id,
            'region_id' : self.region_id,
            'ts': self.ts_add,
            'user': self.user.to_dict()
        }
        return out     

    def __repr__(self):
        return f'Comment: {self.to_dict()}'
            

def _getAnonymous():
    return User.query.filter_by(username='anonymous').first()
    
def _add_admin_user():
    if not User.query.filter_by(username='admin').first():
        admin_user = User(username="admin", email="admin@example.com")
        admin_user.set_password( os.getenv('ADMIN_PASSWORD', 'adminpassword') )
        admin_user.roles.append(Role.query.filter_by(name='admin').first())
        
        db.session.add(admin_user)
        db.session.commit()     
    
def _add_anonymous_user():
    if not User.query.filter_by(username='anonymous').first():
        anon_user = User(username="anonymous", email="")
        anon_user.set_password( secrets.token_urlsafe(20) ) 
        anon_user.roles.append(Role.query.filter_by(name='user').first())
        
        db.session.add(anon_user)
        db.session.commit()   
       
def _add_roles():
    if not Role.query.filter_by(name='admin').first():  #and Role.query... user
        admin_role = Role(name='admin')
        user_role = Role(name='user')
        
        db.session.add(admin_role)
        db.session.add(user_role)
        db.session.commit()           

def init_db():
    _add_roles()
    _add_anonymous_user()
    _add_admin_user()
        
       
        
