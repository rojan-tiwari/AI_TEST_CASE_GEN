
        // Test type descriptions
        const testTypeDescriptions = {
            functional: "Comprehensive testing to verify that software functions work as expected",
            smoke: "Basic testing to ensure core functionality works after deployment or build",
            regression: "Testing to ensure existing functionality still works after changes"
        };

        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.width = Math.random() * 10 + 5 + 'px';
                particle.style.height = particle.style.width;
                particle.style.animationDelay = Math.random() * 6 + 's';
                particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
                particlesContainer.appendChild(particle);
            }
        }

        async function generateTestCase(requirement, testType) {
            const response = await fetch('http://127.0.0.1:5000/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requirement,
                    testType: testType,
                    timestamp: new Date().toISOString() 
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                return { testCase: data.test_case, testCaseType: data.test_case_type };  
            } else {
                throw new Error('Failed to generate test case');
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                const copyBtn = document.querySelector('.copy-btn');
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.style.background = '#28a745';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '#28a745';
                }, 2000);
            });
        }

        function parseTestCaseForDownload(testCaseText, requirement, testType) {
            // Parse the test case text to extract structured data
            const lines = testCaseText.split('\n').filter(line => line.trim());
            const testCaseData = {
                requirement: requirement,
                testType: testType,
                timestamp: new Date().toLocaleString(),
                testCases: []
            };

            let currentTestCase = {};
            let currentSection = '';

            for (let line of lines) {
                line = line.trim();
                
                if (line.toLowerCase().includes('test case') && line.includes(':')) {
                    if (Object.keys(currentTestCase).length > 0) {
                        testCaseData.testCases.push(currentTestCase);
                    }
                    currentTestCase = {
                        title: line,
                        steps: [],
                        expectedResults: [],
                        preconditions: [],
                        testData: []
                    };
                } else if (line.toLowerCase().includes('step') || line.toLowerCase().includes('action')) {
                    currentSection = 'steps';
                    if (line !== 'Steps:' && line !== 'Actions:') {
                        currentTestCase.steps.push(line);
                    }
                } else if (line.toLowerCase().includes('expected') || line.toLowerCase().includes('result')) {
                    currentSection = 'expectedResults';
                    if (!line.toLowerCase().includes('expected result') && !line.toLowerCase().includes('expected:')) {
                        currentTestCase.expectedResults.push(line);
                    }
                } else if (line.toLowerCase().includes('precondition') || line.toLowerCase().includes('prerequisite')) {
                    currentSection = 'preconditions';
                    if (!line.toLowerCase().includes('precondition') && !line.toLowerCase().includes('prerequisite')) {
                        currentTestCase.preconditions.push(line);
                    }
                } else if (line.toLowerCase().includes('test data')) {
                    currentSection = 'testData';
                } else if (line.length > 0 && currentSection) {
                    if (currentTestCase[currentSection]) {
                        currentTestCase[currentSection].push(line);
                    }
                }
            }

            if (Object.keys(currentTestCase).length > 0) {
                testCaseData.testCases.push(currentTestCase);
            }

            return testCaseData;
        }

        function downloadCSV(testCaseText, requirement, testType) {
            const data = parseTestCaseForDownload(testCaseText, requirement, testType);
            
            let csvContent = "Test Case ID,Test Case Title,Test Type,Requirement,Steps,Expected Results,Preconditions,Test Data,Generated On\n";
            
            data.testCases.forEach((testCase, index) => {
                const row = [
                    `TC_${String(index + 1).padStart(3, '0')}`,
                    `"${testCase.title.replace(/"/g, '""')}"`,
                    `"${data.testType}"`,
                    `"${data.requirement.replace(/"/g, '""')}"`,
                    `"${testCase.steps.join('; ').replace(/"/g, '""')}"`,
                    `"${testCase.expectedResults.join('; ').replace(/"/g, '""')}"`,
                    `"${testCase.preconditions.join('; ').replace(/"/g, '""')}"`,
                    `"${testCase.testData.join('; ').replace(/"/g, '""')}"`,
                    `"${data.timestamp}"`
                ].join(',');
                csvContent += row + "\n";
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `test_cases_${testType}_${new Date().getTime()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function downloadPDF(testCaseText, requirement, testType) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set up the document
            doc.setFontSize(20);
            doc.text('AI Generated Test Cases', 20, 30);
            
            doc.setFontSize(12);
            doc.text(`Test Type: ${testType.charAt(0).toUpperCase() + testType.slice(1)} Testing`, 20, 45);
            doc.text(`Generated On: ${new Date().toLocaleString()}`, 20, 55);
            
            // Add requirement
            doc.setFontSize(14);
            doc.text('Requirement:', 20, 75);
            doc.setFontSize(11);
            
            const splitRequirement = doc.splitTextToSize(requirement, 170);
            doc.text(splitRequirement, 20, 85);
            
            // Add test cases
            doc.setFontSize(14);
            let yPosition = 85 + (splitRequirement.length * 7) + 15;
            doc.text('Generated Test Cases:', 20, yPosition);
            
            doc.setFontSize(10);
            yPosition += 15;
            
            const lines = testCaseText.split('\n');
            for (let line of lines) {
                if (line.trim()) {
                    const splitLine = doc.splitTextToSize(line.trim(), 170);
                    
                    // Check if we need a new page
                    if (yPosition + (splitLine.length * 5) > 280) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    doc.text(splitLine, 20, yPosition);
                    yPosition += splitLine.length * 5 + 3;
                }
            }
            
            doc.save(`test_cases_${testType}_${new Date().getTime()}.pdf`);
        }

        // Update test type description when selection changes
        document.getElementById('testType').addEventListener('change', function() {
            const selectedType = this.value;
            const descriptionText = document.getElementById('descriptionText');
            descriptionText.textContent = testTypeDescriptions[selectedType];
        });

        document.getElementById('testCaseForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const requirement = document.getElementById('requirement').value.trim();
            const testType = document.getElementById('testType').value;
            
            if (!requirement) {
                alert('Please enter a requirement or user story');
                return;
            }
            
            const generateBtn = document.getElementById('generateBtn');
            const outputContainer = document.getElementById('outputContainer');
            
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;

            outputContainer.innerHTML = `
                <div class="status-indicator status-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Generating ${testType} test case...
                </div>
                <div class="empty-state">
                    <i class="fas fa-cog fa-spin"></i>
                    <h3>AI is Working</h3>
                    <p>Please wait while we generate your comprehensive ${testType} test case...</p>
                </div>
            `;
            
            try {
                const testCase = await generateTestCase(requirement, testType);
                
                // Show success state
                outputContainer.innerHTML = `
                    <div class="status-indicator status-success">
                        <i class="fas fa-check-circle"></i>
                        ${testType.charAt(0).toUpperCase() + testType.slice(1)} test case generated successfully!
                    </div>
                    <div style="position: relative;">
                        <button class="copy-btn" onclick="copyToClipboard(document.querySelector('.test-case-output').textContent)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <div class="test-case-output">${testCase.testCase}</div>
                        <div class="test-case-category">
                            <strong>Test Case Category:</strong> ${testCase.testCaseType}
                        </div>
                        <div class="test-case-type-info">
                            <strong>Test Type:</strong> ${testType.charAt(0).toUpperCase() + testType.slice(1)} Testing
                        </div>
                    </div>
                `;
                
                outputContainer.classList.add('has-content');
                
            } catch (error) {
                outputContainer.innerHTML = `
                    <div class="status-indicator status-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        Error generating test case
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Generation Failed</h3>
                        <p>There was an error generating your test case. Please try again or contact support.</p>
                    </div>
                `;
            } finally {
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
            }
        });


        

                document.getElementById('automationForm').addEventListener('submit', async function(e) {
                e.preventDefault();

                const progLanguage = document.getElementById('programmingLanguage').value.trim();
                const fileInput = document.getElementById('fileInput');
                const uploadedFile = fileInput.files[0];

                if (!progLanguage) {
                    alert('Please select a programming language');
                    return;
                }

                if (!uploadedFile) {
                    alert('Please upload a file');
                    return;
                }

                const formData = new FormData();
                formData.append('progLanguage', progLanguage);
                formData.append('file', uploadedFile);

                const generateBtn = document.getElementById('generateScriptBtn');
                const outputContainer = document.getElementById('automationOutputContainer');

                generateBtn.classList.add('loading');
                generateBtn.disabled = true;

                outputContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-cog fa-spin"></i>
                        <h3>Generating Script...</h3>
                        <p>Please wait while the AI processes your file.</p>
                    </div>
                `;

                try {
                    const response = await fetch('http://127.0.0.1:5000/upload-csv', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (data.status === 'success') {
                        outputContainer.innerHTML = `
                            <div class="automation-script-output">
                                <div class="script-header">
                                    <h4><i class="fas fa-code"></i> ${progLanguage.toUpperCase()} Automation Script</h4>
                                    <span class="generated-timestamp">Generated: ${new Date().toLocaleString()}</span>
                                </div>
                                <div class="script-content">
                                    <pre><code>${data.automation_script}</code></pre>
                                </div>
                            </div>
                        `;
                    } else {
                        throw new Error(data.message || 'Unknown error');
                    }

                } catch (error) {
                    console.error('Error:', error);
                    outputContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Generation Failed</h3>
                            <p>Error: ${error.message}</p>
                        </div>
                    `;
                } finally {
                    generateBtn.classList.remove('loading');
                    generateBtn.disabled = false;
                }
            });



        document.addEventListener('DOMContentLoaded', function() {
            createParticles();
        });

        