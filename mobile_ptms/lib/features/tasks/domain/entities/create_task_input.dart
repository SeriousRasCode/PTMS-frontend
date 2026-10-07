class CreateTaskInput {
  const CreateTaskInput({
    required this.projectId,
    required this.title,
    required this.description,
    this.startDate,
    this.dueDate,
  });

  final int projectId;
  final String title;
  final String description;
  final DateTime? startDate;
  final DateTime? dueDate;
}
