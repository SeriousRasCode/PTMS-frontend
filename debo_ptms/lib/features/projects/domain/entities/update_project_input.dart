class UpdateProjectInput {
  const UpdateProjectInput({
    required this.projectId,
    required this.name,
    required this.description,
    required this.status,
    this.startDate,
    this.endDate,
  });

  final int projectId;
  final String name;
  final String description;
  final String status;
  final DateTime? startDate;
  final DateTime? endDate;
}
