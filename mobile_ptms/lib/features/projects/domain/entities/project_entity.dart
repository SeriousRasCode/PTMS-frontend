class ProjectEntity {
  const ProjectEntity({
    required this.id,
    required this.name,
    required this.status,
    required this.teamName,
  });

  final int id;
  final String name;
  final String status;
  final String teamName;
}
