class ProjectTaskEntity {
  const ProjectTaskEntity({
    required this.id,
    required this.title,
    required this.status,
    required this.progress,
  });

  final int id;
  final String title;
  final String status;
  final int progress;
}
