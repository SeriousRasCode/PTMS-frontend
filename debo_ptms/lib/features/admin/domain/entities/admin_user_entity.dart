class AdminUserEntity {
  const AdminUserEntity({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
  });

  final int id;
  final String fullName;
  final String email;
  final String role;
  final bool isActive;
}
