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
    
    user = User.query.filter_by(username=username).first() # if this returns a user, then the email already exists in database
    if user: 
        flash('User with this username already exists')
        return redirect(url_for('auth.signup'))    

    user = User(username=username, email=email)
    user.set_password(password)  # Imposta la password criptata
    db.session.add(user)  # equivalente a INSERT
    db.session.commit()

    return redirect(url_for('auth.login'))

@app.route('/profile')
@login_required
def profile():
    return render_template('auth/profile.html', user=current_user)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('default.home'))

@app.route('/dashboard')
@login_required
def admin_dashboard():
    if not current_user.has_role('admin'):
        flash("Accesso non autorizzato!")
        return redirect(url_for('dashboard'))
    return render_template('admin_dashboard.html')

@app.route('/groups')
@login_required
def groups():
    groups = current_user.groups
    return render_template('auth/groups.html', groups=current_user.groups)

@app.route('/groups', methods=['POST'])
@login_required
def groups_post():
    redirect_page = 'auth.groups'
    groupname = request.form["groupname"]
    members = request.form.getlist("members[]")
    
    if not groupname:
        flash('Invalid group name')
        return redirect(url_for(redirect_page))
    if not members:
        flash('Invalid members')
        return redirect(url_for(redirect_page))

    group = Group.query.filter_by(name=groupname).first()
    if group: 
        flash('Group with this name already exists')
        return redirect(url_for(redirect_page))

    group = Group(name=groupname)
    db.session.add(group)
    db.session.commit()

    for member_id in members:
        user = User.query.filter(User.id == member_id).first()
        user.groups.append(group)
        db.session.commit()

    #TODO add members one by one

    return redirect(url_for(redirect_page))

@app.route('/groups/<id>', methods=['DELETE'])
@login_required
#TODO verify membership o ownership
def group_delete(id):
    group = Group.query.filter_by(id=id).first()
    db.session.delete(group)
    db.session.commit()

@app.route('/users')
@login_required
def users():
    '''
    return all users, except current_user in select2 data format
    '''
    name_filter = request.args.get('name')
    if name_filter:
        search = "%{}%".format(name_filter) # TODO replace with f string
        users = User.query.filter(User.username.like(search)).all()
    else:
        users = User.query.all()
    out = { 'results':[]}
    for i, user in enumerate(users):
        record = { 'id':user.id, 'text':user.username}
        out['results'].append( record )

    return jsonify(out)

