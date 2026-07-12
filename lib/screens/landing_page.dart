import 'package:flutter/material.dart';

class LandingPage extends StatelessWidget {
  final VoidCallback onGetStarted;
  final VoidCallback onViewRecruiters;

  const LandingPage({
    super.key,
    required this.onGetStarted,
    required this.onViewRecruiters,
  });

  @override
  Widget build(BuildContext context) {
    final features = [
      {
        'icon': Icons.verified_user_outlined,
        'text': 'Recruiter verification',
        'color': Colors.blue,
        'action': onViewRecruiters,
      },
      {
        'icon': Icons.menu_book_outlined,
        'text': 'Rights education',
        'color': Colors.green,
        'action': null,
      },
      {
        'icon': Icons.phone_android_outlined,
        'text': 'Emergency SOS alerts',
        'color': Colors.red,
        'action': null,
      },
      {
        'icon': Icons.public_outlined,
        'text': 'Embassy contacts',
        'color': Colors.purple,
        'action': null,
      },
      {
        'icon': Icons.home_work_outlined,
        'text': 'Reintegration support',
        'color': Colors.orange,
        'action': null,
      },
    ];

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF0F172A), // Slate 900
              Color(0xFF1E1B4B), // Indigo 950
              Color(0xFF311042), // Deep Purple
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 650),
              child: Card(
                elevation: 12,
                color: const Color(0xFF1E293B).withOpacity(0.95), // Slate 800 with opacity
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: BorderSide(
                    color: const Color(0xFF38BDF8).withOpacity(0.2), // Sky 400
                    width: 1.5,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF38BDF8).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: const Text(
                          'Powered by AI • Bilingual Support',
                          style: TextStyle(
                            color: Color(0xFF38BDF8),
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Title
                      const Text(
                        'UM-SAFE',
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -1,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Uganda Migrant Safe Migration Assistant',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFF1F5F9),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Omuyambi wo mu Safari • Your Journey Companion',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          fontStyle: FontStyle.italic,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Explanation block
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF38BDF8).withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFF38BDF8).withOpacity(0.1),
                          ),
                        ),
                        child: const Text(
                          'Empowering Ugandan migrant workers traveling to the Middle East with information, support, and protection:',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Color(0xFFE2E8F0),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            height: 1.4,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Features grid/list
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: features.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final f = features[index];
                          final icon = f['icon'] as IconData;
                          final text = f['text'] as String;
                          final color = f['color'] as Color;
                          final action = f['action'] as VoidCallback?;

                          return InkWell(
                            onTap: action,
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A).withOpacity(0.4),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: action != null
                                      ? const Color(0xFF38BDF8).withOpacity(0.3)
                                      : const Color(0xFF334155),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(icon, color: color, size: 24),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Text(
                                      text,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ),
                                  if (action != null)
                                    const Icon(
                                      Icons.arrow_forward_ios,
                                      color: Color(0xFF38BDF8),
                                      size: 14,
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 24),

                      // Bullet points
                      Column(
                        children: [
                          _buildBulletPoint('Available in 6 local languages'),
                          const SizedBox(height: 8),
                          _buildBulletPoint('24/7 AI-powered assistance'),
                          const SizedBox(height: 8),
                          _buildBulletPoint('Free & confidential support'),
                        ],
                      ),
                      const SizedBox(height: 32),

                      // Get Started Button
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: onGetStarted,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF38BDF8),
                            foregroundColor: const Color(0xFF0F172A),
                            elevation: 4,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Get Started / Tandika',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 20),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Footer text
                      const Text(
                        'By continuing, you agree to our Terms of Service and Privacy Policy',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Row(
      children: [
        const Icon(Icons.check_circle_outline, color: Color(0xFF38BDF8), size: 18),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
