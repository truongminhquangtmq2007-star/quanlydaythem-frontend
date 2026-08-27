const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

const targetStr = `        navigate('/exam-editor', { state: { examContent: content, meta } });
      } else {
        toast.error("KhA'ng nh-n \`c d_ liu hp l t AI.");
      } catch (error: any) {`;
      
// Wait, encoding is weird, I'll use regex.
const fixRegex = /navigate\('\/exam-editor'[\s\S]*?\} else \{\s*toast\.error\("Không nhận được dữ liệu hợp lệ từ AI\."\);\s*\}\s*catch\s*\(error:\s*any\)\s*\{/u;

const newBlock = `navigate('/exam-editor', { state: { examContent: content, meta } });
      } else {
        toast.error("Không nhận được dữ liệu hợp lệ từ AI.");
      }
    } catch (error: any) {`;

// Let's just fix it carefully
const oldStr = `navigate('/exam-editor', { state: { examContent: content, meta } });
      } else {
        toast.error("Không nhận được dữ liệu hợp lệ từ AI.");
      } catch (error: any) {`;

code = code.replace(`        toast.error("Không nhận được dữ liệu hợp lệ từ AI.");\n      } catch (error: any) {`, `        toast.error("Không nhận được dữ liệu hợp lệ từ AI.");\n      }\n    } catch (error: any) {`);
// Also fallback in case of encoding
code = code.replace(`        toast.error("KhA'ng nh-n \`c d_ liu hp l t AI.");\n      } catch (error: any) {`, `        toast.error("Không nhận được dữ liệu hợp lệ từ AI.");\n      }\n    } catch (error: any) {`);

fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
console.log("Fixed syntax");

