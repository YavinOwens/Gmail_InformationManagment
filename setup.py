from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("local_requirements_simple.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="gmail-information-tagging",
    version="1.0.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="A secure Gmail API workflow for email retrieval and information tagging",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/gmail-information-tagging",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Communications :: Email",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-cov>=4.1.0",
            "black>=23.11.0",
            "flake8>=6.1.0",
            "bandit>=1.7.5",
            "safety>=2.3.5",
        ],
        "web": [
            "flask>=3.0.0",
            "flask-cors>=4.0.0",
            "gunicorn>=21.2.0",
        ],
        "aws": [
            "boto3>=1.34.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "gmail-workflow=gmail_workflow.main:main",
        ],
    },
    include_package_data=True,
    package_data={
        "gmail_workflow": ["*.json", "*.yaml", "*.yml"],
    },
)
