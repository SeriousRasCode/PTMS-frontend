class TaskEntity {
  const TaskEntity({
    required this.id,
    required this.title,
    required this.status,
    required this.progress,
    required this.projectName,
  });

  final int id;
  final String title;
  final String status;
  final int progress;
  final String projectName;
}
