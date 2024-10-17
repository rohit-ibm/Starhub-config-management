import bcrypt

from .app_factory import db

# Models
"""class User(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)  # For hashed passwords
    email = db.Column(db.String(120), nullable=True)

    def set_password(self, password):
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

class Group(db.Model):
    group_id = db.Column(db.Integer, primary_key=True)
    group_name = db.Column(db.String(80), unique=True, nullable=False)

class Task(db.Model):
    task_id = db.Column(db.Integer, primary_key=True)
    task_name = db.Column(db.String(80), unique=True, nullable=False)

class UserGroup(db.Model):
    user_group_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.group_id'), nullable=False)

class GroupTask(db.Model):
    group_task_id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.group_id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.task_id'), nullable=False)"""


class User(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    user_groups = db.relationship('UserGroup', backref='user', lazy=True)

    def set_password(self, password):
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))






class Group(db.Model):
    group_id = db.Column(db.Integer, primary_key=True)
    group_name = db.Column(db.String(50), unique=True, nullable=False)
    group_tasks = db.relationship('GroupTask', backref='group', lazy=True)

class Task(db.Model):
    task_id = db.Column(db.Integer, primary_key=True)
    task_name = db.Column(db.String(50), unique=True, nullable=False)
    group_tasks = db.relationship('GroupTask', backref='task', lazy=True)

"""class UserGroup(db.Model):
    user_group_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.group_id'), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'group_id', name='unique_user_group'),
    )

class GroupTask(db.Model):
    group_task_id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.group_id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.task_id'), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('group_id', 'task_id', name='unique_group_task'),
    )"""

class UserGroup(db.Model):
    user_group_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete='CASCADE'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.group_id', ondelete='CASCADE'), nullable=False)
    __table_args__ = (
        db.UniqueConstraint('user_id', 'group_id', name='unique_user_group'),
    )
class GroupTask(db.Model):
    group_task_id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.group_id', ondelete='CASCADE'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.task_id', ondelete='CASCADE'), nullable=False)
    __table_args__ = (
        db.UniqueConstraint('group_id', 'task_id', name='unique_group_task'),
    )