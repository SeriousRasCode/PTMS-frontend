class TaskProgressUpdateInput {
  const TaskProgressUpdateInput({
    required this.taskId,
    required this.progress,
    this.note,
  });

  final int taskId;
  final int progress;
  final String? note;
}
