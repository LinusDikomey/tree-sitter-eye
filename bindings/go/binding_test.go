package tree_sitter_eye_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-eye"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_eye.Language())
	if language == nil {
		t.Errorf("Error loading Eye grammar")
	}
}
