class AdminTeamEntity {
  const AdminTeamEntity({
    required this.id,
    required this.name,
    required this.createdBy,
  });

  final int id;
  final String name;
  final String createdBy;
}
