class Embassy {
  final String id;
  final String country;
  final String embassyName;
  final String phonePrimary;
  final String? phoneSecondary;
  final String? email;
  final String? address;
  final String? emergencyHotline;
  final String? workingHours;

  Embassy({
    required this.id,
    required this.country,
    required this.embassyName,
    required this.phonePrimary,
    this.phoneSecondary,
    this.email,
    this.address,
    this.emergencyHotline,
    this.workingHours,
  });

  factory Embassy.fromJson(Map<String, dynamic> json) {
    return Embassy(
      id: json['id'] as String,
      country: json['country'] as String,
      embassyName: json['embassy_name'] as String,
      phonePrimary: json['phone_primary'] as String,
      phoneSecondary: json['phone_secondary'] as String?,
      email: json['email'] as String?,
      address: json['address'] as String?,
      emergencyHotline: json['emergency_hotline'] as String?,
      workingHours: json['working_hours'] as String?,
    );
  }
}

class Recruiter {
  final String id;
  final String companyName;
  final String? licenseNumber;
  final String status;
  final String? companyAddress;
  final String? phone;
  final String? email;
  final String? website;
  final List<String> countriesOfOperation;
  final int complaintsCount;
  final String? expiryDate;

  Recruiter({
    required this.id,
    required this.companyName,
    this.licenseNumber,
    required this.status,
    this.companyAddress,
    this.phone,
    this.email,
    this.website,
    required this.countriesOfOperation,
    required this.complaintsCount,
    this.expiryDate,
  });

  factory Recruiter.fromJson(Map<String, dynamic> json) {
    List<String> countries = [];
    if (json['countries_of_operation'] != null) {
      if (json['countries_of_operation'] is List) {
        countries = List<String>.from(json['countries_of_operation']);
      }
    }
    return Recruiter(
      id: json['id'] as String,
      companyName: json['company_name'] as String,
      licenseNumber: json['license_number'] as String?,
      status: json['status'] as String,
      companyAddress: json['company_address'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      website: json['website'] as String?,
      countriesOfOperation: countries,
      complaintsCount: (json['complaints_count'] as num?)?.toInt() ?? 0,
      expiryDate: json['expiry_date'] as String?,
    );
  }
}

class RightsResource {
  final String id;
  final String category;
  final String title;
  final String content;
  final int priority;

  RightsResource({
    required this.id,
    required this.category,
    required this.title,
    required this.content,
    required this.priority,
  });

  factory RightsResource.fromJson(Map<String, dynamic> json) {
    return RightsResource(
      id: json['id'] as String,
      category: json['category'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      priority: (json['priority'] as num?)?.toInt() ?? 0,
    );
  }
}

class ChatMessage {
  final String id;
  final String role; // 'user' or 'assistant'
  final String content;
  final String language;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.language,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      role: json['role'] as String,
      content: json['content'] as String,
      language: json['language'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
