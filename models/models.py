import os
import secrets
from datetime import datetime
import json
from flask_login import UserMixin
from flask import jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.conn import db
from sqlalchemy import ForeignKey, inspect
from sqlalchemy.sql import or_, and_

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
    roles = db.relationship('Role', secondary=user_roles, backref=db.backref('user_roles', lazy='joined')) #TODO chk se lazy='dynamic' funziona
    # tracks = db.relationship('Track', backref=db.backref('user_tracks', lazy='joined')) #TODO chk se lazy='dynamic' funziona
    # regions = db.relationship('Region', backref=db.backref('user_regions', lazy='joined')) #TODO chk se lazy='dynamic' funziona
    # comments = db.relationship('Comment', backref=db.backref('user_comments', lazy='joined')) #TODO chk se lazy='dynamic' funziona

    # I prefer to use properties with a query instad of relationships to avoid joins on User select and useless backreferences
    @property
    def tracks(self):
        return Track.query.filter(Track.user_id == self.id).all()
    
    @property
    def regions(self):
        return Region.query.filter(Region.user_id == self.id).all()    
    
    @property
    def comments(self):
        #query only comments to regions, not those to tracks (which are descriptions)
        return Comment.query.filter( and_( Comment.user_id == self.id, Comment.track_id == None  )  ).all() 
       
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
    
    def to_json(self):
        return json.dumps( self.to_dict() )
    
    def to_dict(self):
        out = {
            'id':self.id,
            'name':self.name,
            'local_name':self.local_name,
            'user':self.user.to_dict()
        }
        return out
    
        
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
    
    @property
    def track(self):
        return Track.query.filter(Track.id == self.track_id).first()  
    
    def to_json(self):
        return json.dumps( self.to_dict() )
    
    def to_dict(self):
        out = {
            'id' : self.id,
            'native_id' : self.native_id,
            'title' : self.title,
            'start' : self.start,
            'end' : self.end,
            'ts': self.ts_add,
            'track':self.track.to_dict()
        }
        return out        
        

class Comment(db.Model, Timestamped):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(1000) )
    track_id = db.Column(db.String(16), ForeignKey('track.id'))
    region_id = db.Column(db.String(16), ForeignKey('region.id'))
    user_id = db.Column(db.Integer() , ForeignKey('user.id'))
    
    user = db.relationship('User', backref=db.backref('user_comments', lazy='joined'))   
    
    @property
    def track(self):
        return Track.query.filter(Track.id == self.track_id).first()  
    
    @property
    def region(self):
        return Region.query.filter(Region.id == self.region_id).first()      
        
    def to_json(self):
        return json.dumps( self.to_dict() )
    
    def to_dict(self):
        out = {
            'id' : self.id,
            'text' : self.text,
            'track_id' : self.track_id,
            'region_id' : self.region_id,
            'ts': self.ts_add,
            'user': self.user.to_dict(),
            'track': self.track.to_dict() if self.track else None,  #for descriptions
            'region': self.region.to_dict() if self.region else None,  #for descriptions
        }
        return out     

    def __repr__(self):
        return f'Comment: {self.to_dict()}'
            
class Transcription(db.Model, Timestamped):
    id = db.Column(db.Integer, primary_key=True)
    # text = db.Column(db.String(1000) )
    language = db.Column(db.String(2) )
    track_id = db.Column(db.String(16), ForeignKey('track.id'))
    user_id = db.Column(db.Integer() , ForeignKey('user.id'))
    
    user = db.relationship('User', backref=db.backref('user_transcriptions', lazy='joined'))  
    # segments = db.relationship('TranscriptionSegment', backref=db.backref('transcription_segments', lazy='joined'))
    
    @property
    def segments(self):
        return TranscriptionSegment.query.filter(  TranscriptionSegment.transcription_id == self.id ).all()     
    
    @property
    def text(self):
        out = ''
        for segment in self.segments:
            out += segment.text + '\n'
        return out
    
    @property
    def track(self):
        return Track.query.filter(Track.id == self.track_id).first()  
    
    def to_json(self):
        return json.dumps( self.to_dict() )
    
    def to_dict(self):
        segments_as_dict = []
        for segment in self.segments:
            segments_as_dict.append( segment.to_dict() )

        out = {
            'id' : self.id,
            'text' : self.text,
            'language' : self.language,
            'track_id' : self.track_id,
            'user_id' : self.user_id,
            'ts': self.ts_add,
            'segments': segments_as_dict,
        }
        return out   
    
class TranscriptionSegment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(1000) )
    start = db.Column(db.Float())
    end = db.Column(db.Float())
    transcription_id = db.Column(db.Integer() , ForeignKey('transcription.id'))
    
    def to_json(self):
        return json.dumps( self.to_dict() )
    
    def to_dict(self):
        out = {
            'id' : self.id,
            'transcription_id' : self.transcription_id,
            'text' : self.text,
            'start' : self.start,
            'end': self.end
        }
        return out      
    
    
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
        
       
        
