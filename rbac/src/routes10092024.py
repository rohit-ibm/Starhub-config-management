from flask import request, jsonify
from flask_restx import Resource, fields
from .models import db, User, Group, Task, UserGroup, GroupTask
import logging


def register_routes(api):
    # API Models for Swagger
    user_model = api.model('User', {
        'username': fields.String(required=True, description='Username of the user'),
        'password': fields.String(required=True, description='Password of the user'),
        'email': fields.String(description='Email of the user')
    })

    reset_password_model = api.model('ResetPassword', {
        'user_id': fields.Integer(required=True, description='User ID of the user'),
        'new_password': fields.String(required=True, description='New password for the user')
    })

    group_model = api.model('Group', {
        'group_name': fields.String(required=True, description='Name of the group')
    })

    task_model = api.model('Task', {
        'task_name': fields.String(required=True, description='Name of the task')
    })

    user_group_model = api.model('UserGroup', {
        'user_id': fields.Integer(required=True, description='User ID'),
        'group_id': fields.Integer(required=True, description='Group ID')
    })

    group_task_model = api.model('GroupTask', {
        'group_id': fields.Integer(required=True, description='Group ID'),
        'task_id': fields.Integer(required=True, description='Task ID')
    })

    # Routes with Swagger
    @api.route('/create_user')
    class CreateUser(Resource):
        @api.expect(user_model)
        def post(self):
            try:
                data = request.json
                user = User(username=data['username'], email=data.get('email'))
                user.set_password(data['password'])
                db.session.add(user)
                db.session.commit()
                logging.info(f"User '{data['username']}' created successfully.")
                return {"message": "User created successfully!", "user_id": user.user_id}, 201
            except Exception as e:
                logging.error(f"Error creating user: {str(e)}")
                return {'message': 'Error creating user'}, 500

    @api.route('/login')
    class Login(Resource):
        @api.expect(user_model)
        def post(self):
            try:
                data = request.json
                user = User.query.filter_by(username=data['username']).first()
                if user and user.check_password(data['password']):
                    return {"message": "Login successful!", "user_id": user.user_id}
                return {"message": "Invalid username or password"}, 401
            except Exception as e:
                logging.error(f"Error during login: {str(e)}")
                return {'message': 'Error during login'}, 500

    @api.route('/add_group')
    class AddGroup(Resource):
        @api.expect(group_model)
        def post(self):
            try:
                data = request.json
                group = Group(group_name=data['group_name'])
                db.session.add(group)
                db.session.commit()
                return {"message": "Group added successfully!", "group_id": group.group_id}, 201
            except Exception as e:
                logging.error(f"Error adding group: {str(e)}")
                return {'message': 'Error adding group'}, 500

    @api.route('/add_task')
    class AddTask(Resource):
        @api.expect(task_model)
        def post(self):
            try:
                data = request.json
                task = Task(task_name=data['task_name'])
                db.session.add(task)
                db.session.commit()
                return {"message": "Task added successfully!", "task_id": task.task_id}, 201
            except Exception as e:
                logging.error(f"Error adding task: {str(e)}")
                return {'message': 'Error adding task'}, 500

    @api.route('/add_user_to_group')
    class AddUserToGroup(Resource):
        @api.expect(user_group_model)
        def post(self):
            try:
                data = request.json
                user_group = UserGroup(user_id=data['user_id'], group_id=data['group_id'])
                db.session.add(user_group)
                db.session.commit()
                return {"message": "User added to group successfully!"}, 201
            except Exception as e:
                logging.error(f"Error adding user to group: {str(e)}")
                return {'message': 'Error adding user to group'}, 500

    @api.route('/remove_user_from_group')
    class RemoveUserFromGroup(Resource):
        @api.expect(user_group_model)
        def delete(self):
            try:
                data = request.json
                user_group = UserGroup.query.filter_by(user_id=data['user_id'], group_id=data['group_id']).first()
                if user_group:
                    db.session.delete(user_group)
                    db.session.commit()
                    return {"message": "User removed from group successfully!"}, 200
                return {"message": "User or Group not found"}, 404
            except Exception as e:
                logging.error(f"Error removing user from group: {str(e)}")
                return {'message': 'Error removing user from group'}, 500

    @api.route('/assign_task_to_group')
    class AssignTaskToGroup(Resource):
        @api.expect(group_task_model)
        def post(self):
            try:
                data = request.json
                group_task = GroupTask(group_id=data['group_id'], task_id=data['task_id'])
                db.session.add(group_task)
                db.session.commit()
                return {"message": "Task assigned to group successfully!"}, 201
            except Exception as e:
                logging.error(f"Error assigning task to group: {str(e)}")
                return {'message': 'Error assigning task to group'}, 500

    @api.route('/remove_task_from_group')
    class RemoveTaskFromGroup(Resource):
        @api.expect(group_task_model)
        def delete(self):
            try:
                data = request.json
                group_task = GroupTask.query.filter_by(group_id=data['group_id'], task_id=data['task_id']).first()
                if group_task:
                    db.session.delete(group_task)
                    db.session.commit()
                    return {"message": "Task removed from group successfully!"}, 200
                return {"message": "Task or Group not found"}, 404
            except Exception as e:
                logging.error(f"Error removing task from group: {str(e)}")
                return {'message': 'Error removing task from group'}, 500

    @api.route('/get_user_groups_and_tasks/<int:user_id>')
    class GetUserGroupsAndTasks(Resource):
        def get(self, user_id):
            try:
                user_groups = db.session.query(UserGroup).filter_by(user_id=user_id).all()
                result = []

                for user_group in user_groups:
                    group = Group.query.filter_by(group_id=user_group.group_id).first()
                    tasks = db.session.query(Task.task_name).join(GroupTask, Task.task_id == GroupTask.task_id).filter(
                        GroupTask.group_id == group.group_id).all()

                    task_list = [task[0] for task in tasks]
                    result.append({"group_name": group.group_name, "tasks": task_list})

                return jsonify(result)
            except Exception as e:
                logging.error(f"Error retrieving user groups and tasks: {str(e)}")
                return {'message': 'Error retrieving user groups and tasks'}, 500

    # Retrieval Endpoints
    @api.route('/users')
    class GetUsers(Resource):
        def get(self):
            try:
                users = User.query.all()
                return jsonify([{'user_id': user.user_id, 'username': user.username} for user in users])
            except Exception as e:
                logging.error(f"Error retrieving users: {str(e)}")
                return {'message': 'Error retrieving users'}, 500

    @api.route('/groups')
    class GetGroups(Resource):
        def get(self):
            try:
                groups = Group.query.all()
                return jsonify([{'group_id': group.group_id, 'group_name': group.group_name} for group in groups])
            except Exception as e:
                logging.error(f"Error retrieving groups: {str(e)}")
                return {'message': 'Error retrieving groups'}, 500

    @api.route('/tasks')
    class GetTasks(Resource):
        def get(self):
            try:
                tasks = Task.query.all()
                return jsonify([{'task_id': task.task_id, 'task_name': task.task_name} for task in tasks])
            except Exception as e:
                logging.error(f"Error retrieving tasks: {str(e)}")
                return {'message': 'Error retrieving tasks'}, 500

    # Lookup Endpoints
    @api.route('/get_user_by_username/<string:username>')
    class GetUserByUsername(Resource):
        def get(self, username):
            try:
                user = User.query.filter_by(username=username).first()
                if user:
                    return {'user_id': user.user_id, 'username': user.username}
                return {'message': 'User not found'}, 404
            except Exception as e:
                logging.error(f"Error retrieving user by username: {str(e)}")
                return {'message': 'Error retrieving user by username'}, 500

    @api.route('/get_group_by_name/<string:group_name>')
    class GetGroupByName(Resource):
        def get(self, group_name):
            try:
                group = Group.query.filter_by(group_name=group_name).first()
                if group:
                    return {'group_id': group.group_id, 'group_name': group.group_name}
                return {'message': 'Group not found'}, 404
            except Exception as e:
                logging.error(f"Error retrieving group by name: {str(e)}")
                return {'message': 'Error retrieving group by name'}, 500

    @api.route('/get_task_by_name/<string:task_name>')
    class GetTaskByName(Resource):
        def get(self, task_name):
            try:
                task = Task.query.filter_by(task_name=task_name).first()
                if task:
                    return {'task_id': task.task_id, 'task_name': task.task_name}
                return {'message': 'Task not found'}, 404
            except Exception as e:
                logging.error(f"Error retrieving task by name: {str(e)}")
                return {'message': 'Error retrieving task by name'}, 500

    # Delete Endpoints
    @api.route('/delete_user/<int:user_id>')
    class DeleteUser(Resource):
        def delete(self, user_id):
            try:
                user = User.query.get(user_id)
                if user:
                    # Remove associated UserGroup records
                    UserGroup.query.filter_by(user_id=user_id).delete()
                    db.session.delete(user)
                    db.session.commit()
                    return {'message': 'User deleted successfully!'}
                return {'message': 'User not found'}, 404
            except Exception as e:
                logging.error(f"Error deleting user by id: {str(e)}")
                return {'message': 'Error deleting user by id'}, 500

    @api.route('/delete_group/<int:group_id>')
    class DeleteGroup(Resource):
        def delete(self, group_id):
            try:
                group = Group.query.get(group_id)
                if group:
                    # Remove associated UserGroup and GroupTask records
                    UserGroup.query.filter_by(group_id=group_id).delete()
                    GroupTask.query.filter_by(group_id=group_id).delete()
                    db.session.delete(group)
                    db.session.commit()
                    return {'message': 'Group deleted successfully!'}
                return {'message': 'Group not found'}, 404
            except Exception as e:
                logging.error(f"Error deleting group by id: {str(e)}")
                return {'message': 'Error deleting group by id'}, 500

    @api.route('/delete_task/<int:task_id>')
    class DeleteTask(Resource):
        def delete(self, task_id):
            try:
                task = Task.query.get(task_id)
                if task:
                    # Remove associated GroupTask records
                    GroupTask.query.filter_by(task_id=task_id).delete()
                    db.session.delete(task)
                    db.session.commit()
                    return {'message': 'Task deleted successfully!'}
                return {'message': 'Task not found'}, 404
            except Exception as e:
                logging.error(f"Error deleting task by id: {str(e)}")
                return {'message': 'Error deleting task by id'}, 500

    """@api.route('/reset_password')
    class ResetPassword(Resource):
        @api.expect(reset_password_model)
        def post(self):
            try:
                data = request.json
                user = User.query.filter_by(user_id=data['user_id']).first()
                if user:
                    if user.check_password(data['new_password']):
                        return {"message": "New password cannot be the same as the current password"}, 400
                    user.set_password(data['new_password'])
                    db.session.commit()
                    return {"message": "Password reset done successfully!"}, 200
                return {"message": "User not found"}, 404
            except Exception as e:
                logging.error(f"Error resetting password: {str(e)}")
                return {'message': 'Error resetting password'}, 500"""


    #for options
    """@api.route('/reset_password', methods=['POST','OPTIONS'])
    class ResetPassword(Resource):
        @api.expect(reset_password_model)
        def options(self):
            return '', 200  # Respond with 200 for OPTIONS requests

        def post(self):
            try:
                data = request.json
                user = User.query.filter_by(user_id=data['user_id']).first()
                if user:
                    if user.check_password(data['new_password']):
                        return {"message": "New password cannot be the same as the current password"}, 400
                    user.set_password(data['new_password'])
                    db.session.commit()
                    return {"message": "Password reset done successfully!"}, 200
                return {"message": "User not found"}, 404
            except Exception as e:
                logging.error(f"Error resetting password: {str(e)}")
                return {'message': 'Error resetting password'}, 500"""

    @api.route('/reset_password', methods=['POST'])
    class ResetPassword(Resource):
        @api.expect(reset_password_model)

        def post(self):
            try:
                data = request.json
                user = User.query.filter_by(user_id=data['user_id']).first()
                if user:
                    if user.check_password(data['new_password']):
                        return {"message": "New password cannot be the same as the current password"}, 400
                    user.set_password(data['new_password'])
                    db.session.commit()
                    return {"message": "Password reset done successfully!"}, 200
                return {"message": "User not found"}, 404
            except Exception as e:
                logging.error(f"Error resetting password: {str(e)}")
                return {'message': 'Error resetting password'}, 500
