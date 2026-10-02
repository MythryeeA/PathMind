from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class QuestionOption(BaseModel):
    id: str = Field(..., description="Unique option identifier, e.g., opt_a")
    text: str = Field(..., description="Option text description")
    misconception_id: Optional[str] = Field(None, description="Mapped misconception ID for distractor option, or null if correct")

class QuestionOutput(BaseModel):
    stem: str = Field(..., description="Question stem statement")
    options: List[QuestionOption] = Field(..., description="List of MCQ options")
    correct_option_id: str = Field(..., description="Keyed correct option ID")
    rationale: str = Field(..., description="Explanation rationale for correct option")

class QuestionVerificationOutput(BaseModel):
    is_unambiguously_correct: bool = Field(..., description="True if the keyed answer is unambiguously correct")
    reasoning: str = Field(..., description="Verifier reasoning")

class ClassifierOutput(BaseModel):
    misconception_id: Optional[str] = Field(None, description="Tagged misconception ID or None")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    evidence: str = Field(..., description="Specific evidence from learner answer")
    kind: Literal["conceptual", "slip", "unclear"] = Field(..., description="Classification category")

class SocraticTutorOutput(BaseModel):
    message: str = Field(..., description="Socratic guiding question or hint (max 80 words)")
    hint_level: int = Field(..., ge=1, le=3, description="Hint intensity level from 1 to 3")
    ready_to_reveal: bool = Field(..., description="Whether answer reveal should be triggered")

class ExplainerOutput(BaseModel):
    style: Literal["analogy", "math", "code"] = Field(..., description="Explanation style used")
    explanation: str = Field(..., description="Dynamic concept explanation in selected style")
    check_question: str = Field(..., description="Quick follow-up stem to confirm understanding")
