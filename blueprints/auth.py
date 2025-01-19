from flask import Blueprint
from flask import render_template
from flask import request
from flask import redirect
from flask import url_for
from flask import flash
from flask import current_app   # definisce il contesto del modulo
from flask_login import login_user  # https://flask-login.readthedocs.io/en/latest/#flask_login.login_user
from flask_login import login_required
from flask_login import logout_user
from flask_login import current_user

from models.conn import db
from models.models import *

app = Blueprint('auth', __name__)

@app.route('/login')
def login():
    # shows the login form page
    return render_template('auth/login.html')

@app.route('/login', methods=['POST'])
def login_post():
    # manages the login form post request
    email = request.form.get('email')
    password = request.form.get('password')
    remember = True if request.form.get('remember') else False

    user = User.query.filter_by(email=email).first()

    # check if the user actually exists
    # take the user-supplied password, hash it, and compare it to the hashed password in the database
    if not user or not user.check_password(password):
        flash('Please check your login details and try again.')
        return redirect(url_for('auth.login')) # if the user doesn't exist or password is wrong, reload the page

    # if the above check passes, then we know the user has the right credentials
    login_user(user, remember=remember)
    return redirect(url_for('auth.profile'))    


@app.route('/signup')
def signup():
    # shows the signup form page
    return render_template('auth/signup.html')

@app.route('/signup', methods=['POST'])
def signup_post():
    # signup input validation and logic
    #TODO verify password strenght
    username = request.form["username"] #as an alternative use request.form.get("username")
    email = request.form["email"]    
    password = request.form["password"]

    if not username:
        flash('Invalid username')
        return redirect(url_for('auth.signup'))
    if not email:
        flash('Invalid email')
        return redirect(url_for('auth.signup'))
    if not password:
        flash('Invalid password')
        return redirect(url_for('auth.signup'))                
    
    user = User.query.filter_by(email=email).first() # if this returns a user, then the email already exists in database
    if user: 
        # if a user is found, we want to redirect back to signup page so user can try again
        # display some kind of error
        flash('User with this email address already exists')
        return redirect(url_for('auth.signup'))

    user = User(username=username, email=email)
    user.set_password(password)  # Imposta la password criptata
    db.session.add(user)  # equivalente a INSERT
    db.session.commit()

    return redirect(url_for('auth.login'))

@app.route('/profile')
@login_required
def profile():
    return render_template('auth/profile.html', name=current_user.username)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('/'))

@app.route('/dashboard')
@login_required
def admin_dashboard():
    if not current_user.has_role('admin'):
        flash("Accesso non autorizzato!")
        return redirect(url_for('dashboard'))
    return render_template('admin_dashboard.html')



### deprecated code

# @app.route('/add')
# def add_user():
#     # username='Pinco'
#     # email='pinco@pallino.net'
#     username=''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
#     email=f'{username}@pallino.net'

#     user = User(username=username, email=email)
#     # user.set_password(password)  # Imposta la password criptata
#     db.session.add(user)  # equivalente a INSERT
#     db.session.commit()
#     return f"Utente {username} creato con successo."  

# @app.route('/<id>', methods =['PUT'])
# def update_user(id):
#     user = User.query.filter_by(id = id).first()
#     if user:
#         user.username = request.json.get('username')
#         user.email = request.json.get('email')
#         try: 
#             db.session.commit()
#             return 'Updated', 200
#         except Exception as e:
#             return f'Error saving user: {e}', 500
#     else:
#         return 'Invalid user ID', 404

# @app.route('/<id>', methods =['DELETE'])
# def delete_user(id):
#     try:
#         user = User.query.filter_by(id = id).first()
#         db.session.delete(user)
#         db.session.commit()
#         return 'Deleted', 200
#     except Exception as e:
#         return f'Error deleting user: {e}', 500


# @app.route('/list')
# def list_users():
#     users = User.query.all()
#     return f'{users}'

# @app.route('/<id>/posts')
# def get_user_posts(id):
#     user = User.query.filter_by(id=id).first()
#     if user:
#         posts = Post.query.filter_by(user_id=user.id).all()
#         return jsonify(json_list=[p.to_json() for p in posts])
#     else:
#         return None
    
# @app.route('/<id>/post', methods = ['POST'])
# def add_user_post(id):
#     #check if user exists... just in case someone is messing with my system :D
#     user = User.query.filter_by(id=id).first()
#     if user:
#         try:
#             post = Post(title = request.json.get('title'),
#                         body = request.json.get('body'),
#                         user_id = id)
            
#             db.session.add(post)  # equivalente a INSERT
#             db.session.commit()
#             return 'Post saved', 200
#         except Exception as e:
#             return f'Error saving post: {e}', 500 
#     else:
#         return 'Invalid user id', 404