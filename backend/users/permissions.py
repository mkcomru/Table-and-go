from rest_framework import permissions

class IsBranchAdmin(permissions.BasePermission):
    """
    Разрешение для администраторов филиалов.
    """
    def has_object_permission(self, request, view, obj):
        # Проверяем, является ли пользователь администратором этого филиала
        if not request.user.is_authenticated:
            return False
            
        # Получаем филиал из объекта (obj может быть Branch или другим объектом)
        if hasattr(obj, 'branch'):
            branch = obj.branch
        elif type(obj).__name__ == 'Branch':
            branch = obj
        else:
            return False
            
        return request.user.is_admin_of_branch(branch)


class IsBranchAdminOrReadOnly(permissions.BasePermission):
    """
    Разрешение для администраторов филиалов с разрешением чтения для всех.
    """
    def has_permission(self, request, view):
        # Разрешаем GET, HEAD, OPTIONS запросы всем
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Требуем аутентификацию для других методов
        return request.user.is_authenticated
        
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD, OPTIONS запросы всем
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Проверяем, является ли пользователь администратором этого филиала
        if hasattr(obj, 'branch'):
            branch = obj.branch
        elif type(obj).__name__ == 'Branch':
            branch = obj
        else:
            return False
            
        return request.user.is_admin_of_branch(branch)








