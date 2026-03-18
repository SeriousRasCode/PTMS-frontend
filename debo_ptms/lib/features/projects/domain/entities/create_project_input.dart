class CreateProjectInput {
  const CreateProjectInput({
    required this.name,
    required this.description,
    required this.teamId,
    this.startDate,
    this.endDate,
  });

  final String name;
  final String description;
  final int teamId;
  final DateTime? startDate;
  final DateTime? endDate;
}
