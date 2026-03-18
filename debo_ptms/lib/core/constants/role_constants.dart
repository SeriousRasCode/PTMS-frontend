class AppRoles {
  AppRoles._();

  static const String admin = 'admin';
  static const String projectManager = 'project manager';
  static const String manager = 'manager';
  static const String teamMember = 'team member';
  static const String member = 'member';

  static bool isAdmin(String? role) {
    final value = _norm(role);
    return value == admin;
  }

  static bool isManager(String? role) {
    final value = _norm(role);
    return value == projectManager || value == manager;
  }

  static bool isMember(String? role) {
    final value = _norm(role);
    return value == teamMember || value == member;
  }

  static String _norm(String? value) {
    return (value ?? '').trim().toLowerCase();
  }
}

class RegisterRoleOption {
  const RegisterRoleOption({
    required this.label,
    required this.roleId,
  });

  final String label;
  final int roleId;
}

const List<RegisterRoleOption> registerRoleOptions = [
  RegisterRoleOption(label: 'Admin', roleId: 1),
  RegisterRoleOption(label: 'Project Manager', roleId: 2),
  RegisterRoleOption(label: 'Team Member', roleId: 3),
];
