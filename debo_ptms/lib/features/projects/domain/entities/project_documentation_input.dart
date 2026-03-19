class ProjectDocumentationInput {
  const ProjectDocumentationInput({
    required this.projectId,
    required this.projectName,
    required this.projectStatus,
    required this.title,
    required this.content,
  });

  final int projectId;
  final String projectName;
  final String projectStatus;
  final String title;
  final String content;
}
