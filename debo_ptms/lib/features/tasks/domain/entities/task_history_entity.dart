class TaskHistoryEntity {
  const TaskHistoryEntity({
    required this.progress,
    required this.status,
    required this.note,
    required this.updatedBy,
    required this.updatedAt,
  });

  final int progress;
  final String status;
  final String note;
  final String updatedBy;
  final String updatedAt;
}
