
import os
import logging
from logging import Formatter
from flask import Flask, url_for, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager

from dotenv import load_dotenv
load_dotenv()


from blueprints.default import app as hello_app
from blueprints.api import app as api_app
from blueprints.auth import app as auth_app

from models.conn import db
from models.models import User, init_db

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'TERCES')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///flask_hello.db')
app.config['UPLOAD_FOLDER'] = os.getenv("UPLOAD_FOLDER", './uploads')
#db = SQLAlchemy(app)   #removed to avoid circular import

db.init_app(app)    #added to avoid circular import
# Configurazione di Flask-Migrate
migrate = Migrate(app, db)

app.register_blueprint(hello_app)
app.register_blueprint(api_app)
app.register_blueprint(auth_app, url_prefix = '/auth')

# flask_login user loader block
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    # since the user_id is just the primary key of our user table, use it in the query for the user
    stmt = db.select(User).filter_by(id=user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    
    # return User.query.get(int(user_id))   # legacy
    
    return user

def change_logger():
    # redefining default formatter https://flask.palletsprojects.com/en/stable/logging/
    formatter = Formatter("[%(asctime)s] %(levelname)-8s %(process)d %(thread)s %(name)s in %(filename)s %(funcName)s():%(lineno)d %(message)s")
    app.logger.handlers[0].setFormatter(formatter)
    app.logger.setLevel(logging.DEBUG)

if __name__ == '__main__':
    with app.app_context():
        change_logger()
        init_db()
    app.run(debug=True)