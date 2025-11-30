import Foundation
import ExpoModulesCore

public class ShareExtensionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ShareExtensionModule")

    Function("close") {
      DispatchQueue.main.async {
        NotificationCenter.default.post(name: NSNotification.Name("close"), object: nil)
      }
    }

    Function("openHostApp") { (path: String?) in
      DispatchQueue.main.async {
        var userInfo: [String: Any] = [:]
        if let path = path {
          userInfo["path"] = path
        }
        NotificationCenter.default.post(
          name: NSNotification.Name("openHostApp"),
          object: nil,
          userInfo: userInfo
        )
      }
    }
  }
}
